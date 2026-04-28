// src/components/MoodTracker.jsx
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOODS = [
  { emoji: '😢', label: 'Awful', score: 1, color: 'bg-red-600' },
  { emoji: '😞', label: 'Bad', score: 3, color: 'bg-orange-500' },
  { emoji: '😐', label: 'Okay', score: 5, color: 'bg-yellow-500' },
  { emoji: '🙂', label: 'Good', score: 7, color: 'bg-green-500' },
  { emoji: '😊', label: 'Great', score: 8, color: 'bg-emerald-500' },
  { emoji: '🤩', label: 'Amazing', score: 10, color: 'bg-violet-500' },
];

const TRIGGERS = ['Work', 'Relationships', 'Health', 'Money', 'Sleep', 'Exercise', 'Social', 'Weather', 'News', 'Achievement'];

export default function MoodTracker({ isOpen, onClose, onSave, moodHistory }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedMood) return;
    onSave(selectedMood.label.toLowerCase(), selectedMood.score, note, selectedTriggers);
    setSelectedMood(null);
    setSelectedTriggers([]);
    setNote('');
    onClose();
  };

  const toggleTrigger = (t) => {
    setSelectedTriggers(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  // Mini chart from history
  const recentMoods = (moodHistory || []).slice(-14);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 z-50 msg-animate max-h-[85vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-200">How are you feeling?</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {/* Mood selection */}
        <div className="grid grid-cols-6 gap-2 mb-5">
          {MOODS.map(m => (
            <button
              key={m.score}
              onClick={() => setSelectedMood(m)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                selectedMood?.score === m.score
                  ? 'bg-violet-600/30 border border-violet-500 scale-110'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-slate-500 mt-1">{m.label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <>
            {/* Triggers */}
            <p className="text-xs text-slate-500 mb-2">What's influencing your mood?</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {TRIGGERS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTrigger(t)}
                  className={`px-2.5 py-1 rounded-full text-xs transition ${
                    selectedTriggers.includes(t)
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any thoughts? (optional)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 mb-4 resize-none h-16"
            />

            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-xl font-semibold text-white text-sm transition-all"
            >
              Log Mood
            </button>
          </>
        )}

        {/* Mini mood chart */}
        {recentMoods.length > 1 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Recent mood trend</p>
            <div className="flex items-end gap-1 h-16">
              {recentMoods.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-gradient-to-t from-violet-600 to-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${m.mood_score * 10}%` }}
                  />
                  <span className="text-[8px] text-slate-600">
                    {new Date(m.created_at).toLocaleDateString('en', { day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
