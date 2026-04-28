// src/components/ChatMessage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { User, Heart, Check, Reply, Trash2 } from 'lucide-react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '💜'];

export default function ChatMessage({ msg, index, onDelete, onReply, isNew }) {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(msg.reaction || null);
  const [floatingReaction, setFloatingReaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef(null);
  const messageRef = useRef(null);

  const isUser = msg.role === 'user';

  // --- Long press for action menu ---
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    longPressTimerRef.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30);
      setShowActions(true);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if moved
    if (Math.abs(dx) > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
    }

    // Swipe to reply (swipe right on GULU messages, left on user messages)
    if (dy < 30 && Math.abs(dx) > 20) {
      const swipeDir = isUser ? Math.min(0, dx) : Math.max(0, dx);
      setSwipeX(swipeDir * 0.5);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimerRef.current);

    // Check if swiped enough to trigger reply
    if (Math.abs(swipeX) > 40) {
      if (navigator.vibrate) navigator.vibrate(15);
      onReply?.(msg);
    }

    setSwipeX(0);
  };

  // Desktop: right-click for actions
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowActions(true);
  };

  // Double-click for quick reaction
  const handleDoubleClick = () => {
    if (!selectedReaction) {
      handleReaction('❤️');
    }
  };

  const handleReaction = (emoji) => {
    setSelectedReaction(emoji);
    setShowReactions(false);

    // Floating animation
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 800);

    // Haptic
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDelete = () => {
    setShowActions(false);
    setIsDeleting(true);
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => onDelete?.(msg), 400);
  };

  // Close menus on outside click
  useEffect(() => {
    if (!showReactions && !showActions) return;
    const close = () => { setShowReactions(false); setShowActions(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showReactions, showActions]);

  // Animation class
  const animClass = isNew
    ? (isUser ? 'msg-user' : 'msg-gulu')
    : 'msg-animate-fast';

  return (
    <div
      ref={messageRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} relative no-select ${isDeleting ? 'msg-deleting' : animClass}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
    >
      {/* Swipe reply indicator */}
      {swipeX !== 0 && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${isUser ? 'right-full mr-2' : 'left-full ml-2'} text-slate-500`}>
          <Reply size={18} />
        </div>
      )}

      <div className={`flex gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          isUser ? 'bg-slate-700' : 'bg-gradient-to-br from-violet-500 to-blue-600'
        }`}>
          {isUser ? <User size={14} /> : <Heart size={14} />}
        </div>

        {/* Bubble */}
        <div className="relative group">
          {/* Reply context */}
          {msg.replyTo && (
            <div className="px-3 py-1.5 mb-1 bg-slate-800/50 border-l-2 border-violet-500 rounded-lg text-xs text-slate-400 truncate max-w-[200px]">
              {msg.replyTo.content}
            </div>
          )}

          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed relative ${
            isUser
              ? 'bg-slate-800 text-slate-200 rounded-tr-sm'
              : 'bg-violet-950/40 border border-violet-900/30 text-slate-200 rounded-tl-sm'
          }`}>
            <p className="whitespace-pre-wrap">{msg.content}</p>

            {/* Timestamp + read checks */}
            <div className={`flex items-center gap-1 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-slate-600">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isUser && (
                <svg width="16" height="10" viewBox="0 0 16 10" className="ml-0.5">
                  <polyline points="1,5 4,8 10,2" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="read-check" />
                  <polyline points="5,5 8,8 14,2" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="read-check read-check-2" />
                </svg>
              )}
            </div>
          </div>

          {/* Selected reaction */}
          {selectedReaction && (
            <div className={`absolute -bottom-3 ${isUser ? 'left-2' : 'right-2'} bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5 text-xs cursor-pointer reaction-pop`}
              onClick={(e) => { e.stopPropagation(); setShowReactions(true); }}>
              {selectedReaction}
            </div>
          )}

          {/* Floating reaction animation */}
          {floatingReaction && (
            <div className={`reaction-float text-2xl ${isUser ? 'left-2' : 'right-2'} bottom-0`}>
              {floatingReaction}
            </div>
          )}

          {/* Reaction button (hover/tap) */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
            className={`absolute -bottom-2 ${isUser ? 'right-2' : 'left-10'} opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs text-slate-400 hover:text-white hover:bg-slate-700`}
          >
            +
          </button>

          {/* Reaction picker */}
          {showReactions && (
            <div
              className={`absolute bottom-8 ${isUser ? 'right-0' : 'left-0'} bg-slate-800 border border-slate-700 rounded-2xl px-2 py-1.5 flex gap-1 z-40 reaction-picker shadow-xl`}
              onClick={e => e.stopPropagation()}
            >
              {REACTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => handleReaction(r)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center text-lg transition-transform hover:scale-125 active:scale-90"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Long-press action menu */}
          {showActions && (
            <div
              className={`absolute bottom-full mb-2 ${isUser ? 'right-0' : 'left-0'} bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-40 reaction-picker shadow-xl min-w-[140px]`}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => { onReply?.(msg); setShowActions(false); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                <Reply size={14} /> Reply
              </button>
              {isUser && (
                <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
