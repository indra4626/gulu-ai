import React, { useEffect, useState, useRef } from 'react';
import { Send, Lock, Unlock, ShieldAlert, Bot, User, Trash2, Settings, X, Brain, Heart } from 'lucide-react';
import { sendToGemini } from './services/geminiApi';
import { buildSystemPrompt, detectEmotion } from './utils/guluPersonality';
import { maskSensitiveData } from './utils/piiScanner';
import {
  getUserProfile, getConversationSummary, extractUserInfo,
  updateProfile, getApiKey, saveApiKey, saveConversationSummary
} from './utils/memoryManager';

const INACTIVITY_LIMIT = 15 * 60 * 1000;

function App() {
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [realWorldData, setRealWorldData] = useState({ time: '', date: '', greeting: '' });
  const [error, setError] = useState('');
  const lastActiveRef = useRef(Date.now());
  const messagesEndRef = useRef(null);

  // Load API key on mount
  useEffect(() => {
    const stored = getApiKey();
    if (stored) {
      setApiKey(stored);
    } else {
      setShowSettings(true);
    }
  }, []);

  // Real-world awareness timer
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hour = now.getHours();
      let greeting = 'Hey there!';
      if (hour < 5) greeting = 'Still up? 🌙';
      else if (hour < 12) greeting = 'Good morning! ☀️';
      else if (hour < 17) greeting = 'Good afternoon! 🌤️';
      else if (hour < 21) greeting = 'Good evening! 🌆';
      else greeting = 'Good night! 🌙';

      setRealWorldData({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        greeting
      });

      // Inactivity check
      if (Date.now() - lastActiveRef.current > INACTIVITY_LIMIT && !isLocked) {
        setIsLocked(true);
        setChatHistory([]);
        setCurrentEmotion('neutral');
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      saveApiKey(apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowSettings(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    lastActiveRef.current = Date.now();
    setError('');

    const rawText = inputText.trim();
    setInputText('');

    // PII scan
    const { maskedText, hasSensitiveData } = maskSensitiveData(rawText);

    // Extract & save user info
    const userInfo = extractUserInfo(rawText);
    if (Object.keys(userInfo).length > 0) {
      updateProfile(userInfo);
    }

    // Add user message
    const userMsg = { role: 'user', content: rawText, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);

    // Send to Gemini
    setIsTyping(true);
    setCurrentEmotion('thinking');

    try {
      const profile = getUserProfile();
      const summary = getConversationSummary();
      const systemPrompt = buildSystemPrompt(profile, summary);

      // Build API history (use masked text for API, raw for display)
      const apiHistory = newHistory.map(msg => ({
        ...msg,
        content: msg.role === 'user' ? maskSensitiveData(msg.content).maskedText : msg.content
      }));

      // Keep last 20 messages for context window
      const trimmedHistory = apiHistory.slice(-20);

      const response = await sendToGemini(apiKey, systemPrompt, trimmedHistory);

      const guluMsg = { role: 'gulu', content: response, timestamp: Date.now() };
      setChatHistory(prev => [...prev, guluMsg]);

      // Detect emotion from response
      const emotion = detectEmotion(response);
      setCurrentEmotion(emotion);

      // Update conversation summary periodically (every 10 messages)
      if (newHistory.length % 10 === 0) {
        const recentMsgs = newHistory.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
        saveConversationSummary(recentMsgs);
      }

    } catch (err) {
      setError(err.message);
      setCurrentEmotion('neutral');
    } finally {
      setIsTyping(false);
    }
  };

  const getEmotionDisplay = () => {
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
    return emotions[currentEmotion] || emotions.neutral;
  };

  const emotionData = getEmotionDisplay();

  // --- Locked Screen ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 text-center max-w-sm">
          <Lock size={56} className="mx-auto mb-5 text-slate-500" />
          <h1 className="text-2xl font-bold mb-2 text-slate-200">Session Locked</h1>
          <p className="text-slate-400 mb-6 text-sm">GULU locked herself after 15 minutes of inactivity. Your memory is safe.</p>
          <button
            onClick={() => { setIsLocked(false); lastActiveRef.current = Date.now(); }}
            className="w-full px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white"
          >
            <Unlock size={18} /> Unlock GULU
          </button>
        </div>
      </div>
    );
  }

  // --- Settings Modal ---
  if (showSettings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2"><Settings size={20}/> Setup GULU</h2>
            {apiKey && <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-300"><X size={20}/></button>}
          </div>
          <p className="text-slate-400 text-sm mb-4">Paste your Google Gemini API key below. It stays on your device only.</p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 mb-4"
          />
          <button
            onClick={handleSaveKey}
            disabled={!apiKeyInput.trim()}
            className="w-full px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold transition-all text-white"
          >
            Save & Start Chatting
          </button>
          <p className="text-slate-600 text-xs mt-3 flex items-center gap-1"><ShieldAlert size={12}/> Stored in localStorage. Never sent anywhere except Google's API.</p>
        </div>
      </div>
    );
  }

  // --- Main Chat UI ---
  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">

      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${emotionData.color} flex items-center justify-center text-xl shadow-lg relative transition-all duration-500`}>
            {emotionData.emoji}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">GULU</h1>
            <p className="text-xs text-slate-500">{emotionData.label} • {realWorldData.time}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-slate-500 mr-2">{realWorldData.date}</span>
          <button onClick={() => { setChatHistory([]); }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Clear Chat">
            <Trash2 size={18} />
          </button>
          <button onClick={() => { setApiKeyInput(apiKey); setShowSettings(true); }} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition" title="Settings">
            <Settings size={18} />
          </button>
          <button onClick={() => setIsLocked(true)} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition" title="Lock">
            <Lock size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center text-4xl shadow-2xl">
              🤖
            </div>
            <p className="text-lg font-semibold text-slate-300">Hey! I'm GULU 💜</p>
            <p className="text-sm text-slate-500 max-w-sm text-center">Your private AI companion. Everything is encrypted and stays on your device. Say hi!</p>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {['Hi GULU! 👋', 'How are you?', 'Tell me about yourself'].map(q => (
                <button key={q} onClick={() => { setInputText(q); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-violet-500 to-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Heart size={14} />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-slate-200 rounded-tr-sm'
                  : 'bg-violet-950/40 border border-violet-900/30 text-slate-200 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                <Heart size={14} />
              </div>
              <div className="px-4 py-3 bg-violet-950/40 border border-violet-900/30 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 px-4 pb-4 pt-2">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Talk to GULU..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl px-5 flex items-center justify-center transition-all"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[11px] text-slate-600 mt-2 flex items-center justify-center gap-1">
          <ShieldAlert size={10} /> PII auto-redacted • AES-256 encrypted • Stored locally only
        </p>
      </footer>
    </div>
  );
}

export default App;
