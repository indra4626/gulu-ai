import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Lock, ShieldAlert, User, Trash2, Settings, X, Heart, LogOut, Reply, Undo2 } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import { supabase } from './services/supabase';
import { deriveKey } from './utils/cryptoUtils';
import { sendToGemini } from './services/geminiApi';
import { buildSystemPrompt, detectEmotion } from './utils/guluPersonality';
import { maskSensitiveData } from './utils/piiScanner';
import { extractUserInfo } from './utils/memoryManager';
import { loadMessages, saveMessage, clearAllMessages, saveProfile, loadProfile } from './services/messageService';
import AuthScreen from './components/AuthScreen';

function App() {
  // Auth state
  const [session, setSession] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Chat state
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [userProfile, setUserProfile] = useState({});
  const [conversationSummary, setConversationSummary] = useState('');

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [realWorldData, setRealWorldData] = useState({ time: '', date: '' });
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [undoMsg, setUndoMsg] = useState(null);
  const [sendAnimating, setSendAnimating] = useState(false);
  const [newMsgIds, setNewMsgIds] = useState(new Set());
  const undoTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const passwordRef = useRef('');

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        // Session exists but we need the password to derive key
        // User needs to re-login for encryption key
        setSession(null);
      }
      setAuthLoading(false);
    });
  }, []);

  // Real-world time
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setRealWorldData({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when authenticated
  const loadData = useCallback(async (key) => {
    try {
      const messages = await loadMessages(key);
      setChatHistory(messages);

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const { profile, summary } = await loadProfile(key, userId);
        setUserProfile(profile);
        setConversationSummary(summary);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
  }, []);

  // Load API key from localStorage
  useEffect(() => {
    if (session) {
      const stored = localStorage.getItem('gulu_api_key');
      if (stored) {
        setApiKey(stored);
      } else {
        setShowSettings(true);
      }
    }
  }, [session]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!session || !cryptoKey) return;

    const channel = supabase
      .channel('messages-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${session.user.id}`,
      }, async (payload) => {
        // Message arrived from another device — decrypt and add
        const { decryptData } = await import('./utils/cryptoUtils');
        const content = await decryptData(cryptoKey, payload.new.encrypted_content);
        const newMsg = {
          id: payload.new.id,
          role: payload.new.role,
          content: content || '[encrypted]',
          emotion: payload.new.emotion,
          timestamp: new Date(payload.new.created_at).getTime(),
        };

        setChatHistory(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, cryptoKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // --- Auth handler ---
  const handleAuth = async (newSession, password) => {
    setSession(newSession);
    passwordRef.current = password;
    const key = await deriveKey(password);
    setCryptoKey(key);
    await loadData(key);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCryptoKey(null);
    setChatHistory([]);
    setUserProfile({});
    passwordRef.current = '';
  };

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gulu_api_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowSettings(false);
    }
  };

  // --- Send message ---
  const handleSend = async () => {
    if (!inputText.trim() || isTyping || !cryptoKey || !session) return;
    setError('');

    const rawText = inputText.trim();
    setInputText('');
    const currentReply = replyTo;
    setReplyTo(null);

    // Send button animation + haptic
    setSendAnimating(true);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setSendAnimating(false), 150);

    const { maskedText } = maskSensitiveData(rawText);
    const userInfo = extractUserInfo(rawText);
    let updatedProfile = { ...userProfile };
    if (Object.keys(userInfo).length > 0) {
      for (const [k, v] of Object.entries(userInfo)) {
        if (k === 'interest') {
          const existing = updatedProfile.interests || '';
          if (!existing.toLowerCase().includes(v.toLowerCase())) {
            updatedProfile.interests = existing ? `${existing}, ${v}` : v;
          }
        } else {
          updatedProfile[k] = v;
        }
      }
      setUserProfile(updatedProfile);
    }

    // Save user message to Supabase
    const savedUser = await saveMessage(cryptoKey, session.user.id, 'user', rawText);
    if (currentReply) savedUser.replyTo = currentReply;
    setNewMsgIds(prev => new Set([...prev, savedUser.id]));
    setChatHistory(prev => [...prev, savedUser]);

    // Get AI response
    setIsTyping(true);
    setCurrentEmotion('thinking');

    try {
      const systemPrompt = buildSystemPrompt(updatedProfile, conversationSummary);
      const apiHistory = [...chatHistory, { role: 'user', content: maskedText }]
        .slice(-20)
        .map(msg => ({
          ...msg,
          content: msg.role === 'user' ? maskSensitiveData(msg.content).maskedText : msg.content,
        }));

      const response = await sendToGemini(apiKey, systemPrompt, apiHistory);
      const emotion = detectEmotion(response);

      // Save GULU's response to Supabase
      const savedGulu = await saveMessage(cryptoKey, session.user.id, 'gulu', response, emotion);
      setNewMsgIds(prev => new Set([...prev, savedGulu.id]));
      setChatHistory(prev => [...prev, savedGulu]);
      setCurrentEmotion(emotion);

      // Update profile periodically
      if (chatHistory.length % 10 === 0) {
        const recentMsgs = chatHistory.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
        setConversationSummary(recentMsgs);
        await saveProfile(cryptoKey, session.user.id, updatedProfile, recentMsgs);
      }

    } catch (err) {
      setError(err.message);
      setCurrentEmotion('neutral');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Delete ALL chat history? This cannot be undone.')) return;
    await clearAllMessages(session.user.id);
    setChatHistory([]);
  };

  // Delete single message with undo
  const handleDeleteMsg = (msg) => {
    setChatHistory(prev => prev.filter(m => m.id !== msg.id));
    setUndoMsg(msg);
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoMsg(null);
      // Actually delete from Supabase after undo window
      supabase.from('messages').delete().eq('id', msg.id);
    }, 5000);
  };

  const handleUndo = () => {
    if (!undoMsg) return;
    clearTimeout(undoTimerRef.current);
    setChatHistory(prev => {
      const restored = [...prev, undoMsg].sort((a, b) => a.timestamp - b.timestamp);
      return restored;
    });
    setUndoMsg(null);
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    // Focus the input
    document.querySelector('input[placeholder="Talk to GULU..."]')?.focus();
  };

  // --- Emotion display ---
  const emotions = {
    neutral: { emoji: '🤖', label: 'Idle', color: 'from-slate-500 to-slate-600' },
    happy: { emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-500' },
    caring: { emoji: '🤗', label: 'Caring', color: 'from-pink-400 to-rose-500' },
    playful: { emoji: '😄', label: 'Playful', color: 'from-green-400 to-emerald-500' },
    curious: { emoji: '🤔', label: 'Curious', color: 'from-blue-400 to-cyan-500' },
    excited: { emoji: '✨', label: 'Excited', color: 'from-amber-400 to-yellow-500' },
    thinking: { emoji: '💭', label: 'Thinking...', color: 'from-violet-400 to-purple-500' },
    warning: { emoji: '🛡️', label: 'Alert', color: 'from-orange-500 to-red-500' },
  };
  const emo = emotions[currentEmotion] || emotions.neutral;

  // --- Loading ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Auth Screen ---
  if (!session) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  // --- Settings ---
  if (showSettings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2"><Settings size={20}/> Setup GULU</h2>
            {apiKey && <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-300"><X size={20}/></button>}
          </div>
          <p className="text-slate-400 text-sm mb-4">Paste your Google Gemini API key. It stays in your browser only.</p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 mb-4"
          />
          <button onClick={handleSaveKey} disabled={!apiKeyInput.trim()} className="w-full px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold text-white transition-all">
            Save & Start Chatting
          </button>
        </div>
      </div>
    );
  }

  // --- Main Chat ---
  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">

      <header className="flex-shrink-0 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${emo.color} flex items-center justify-center text-xl shadow-lg relative transition-all duration-500`}>
            {emo.emoji}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">GULU</h1>
            <p className="text-xs text-slate-500">{emo.label} • {realWorldData.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-slate-500 mr-2">{realWorldData.date}</span>
          <button onClick={handleClearChat} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Clear Chat"><Trash2 size={18} /></button>
          <button onClick={() => { setApiKeyInput(apiKey); setShowSettings(true); }} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition" title="Settings"><Settings size={18} /></button>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center text-4xl shadow-2xl">🤖</div>
            <p className="text-lg font-semibold text-slate-300">Hey! I'm GULU 💜</p>
            <p className="text-sm text-slate-500 max-w-sm text-center">Your messages are end-to-end encrypted and synced across devices. Say hi!</p>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {['Hi GULU! 👋', 'How are you?', 'Tell me about yourself'].map(q => (
                <button key={q} onClick={() => setInputText(q)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition">{q}</button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <ChatMessage
            key={msg.id || idx}
            msg={msg}
            index={idx}
            isNew={newMsgIds.has(msg.id)}
            onDelete={handleDeleteMsg}
            onReply={handleReply}
          />
        ))}

        {isTyping && (
          <div className="flex justify-start msg-gulu typing-container">
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center"><Heart size={14} /></div>
              <div className="px-4 py-3.5 bg-violet-950/40 border border-violet-900/30 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-violet-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full typing-dot"></span>
                  </div>
                  <span className="text-xs text-slate-500 ml-1">GULU is typing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mx-auto max-w-md bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">⚠️ {error}</div>}
        <div ref={messagesEndRef} />
      </main>

      {/* Undo Toast */}
      {undoMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 undo-toast">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xl">
            <span className="text-sm text-slate-300">Message deleted</span>
            <button onClick={handleUndo} className="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1">
              <Undo2 size={14} /> Undo
            </button>
          </div>
        </div>
      )}

      <footer className="flex-shrink-0 px-4 pb-4 pt-2">
        {/* Reply bar */}
        {replyTo && (
          <div className="reply-bar flex items-center justify-between bg-slate-800/80 border-l-2 border-violet-500 rounded-lg px-3 py-2 mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply size={14} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 truncate">Replying to: {replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '...' : ''}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-300 flex-shrink-0 ml-2"><X size={14} /></button>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Talk to GULU..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-sm" />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl px-5 flex items-center justify-center transition-all ${sendAnimating ? 'send-press' : ''}`}
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[11px] text-slate-600 mt-2 flex items-center justify-center gap-1">
          <ShieldAlert size={10} /> E2E encrypted • Synced across devices • PII auto-redacted
        </p>
      </footer>
    </div>
  );
}

export default App;
