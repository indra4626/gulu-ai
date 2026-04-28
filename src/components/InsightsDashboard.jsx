// src/components/InsightsDashboard.jsx
import React from 'react';
import { X, TrendingUp, MessageSquare, Brain, Calendar, Flame, BarChart3 } from 'lucide-react';

export default function InsightsDashboard({ isOpen, onClose, insights }) {
  if (!isOpen || !insights) return null;

  const { messageCount, userMessageCount, guluMessageCount, avgMsgLength, topTopics, avgMood, moodTrend, dailyActivity, mostActiveDay, uniqueDays, memoryCount, insights: textInsights } = insights;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 z-50 msg-animate max-h-[85vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2"><BarChart3 size={18} /> Weekly Insights</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard icon={MessageSquare} label="Messages" value={messageCount} color="text-blue-400" />
          <StatCard icon={Flame} label="Streak" value={`${uniqueDays} days`} color="text-orange-400" />
          <StatCard icon={Brain} label="Memories" value={memoryCount} color="text-violet-400" />
          <StatCard icon={Calendar} label="Active Day" value={mostActiveDay || '-'} color="text-green-400" />
        </div>

        {/* Mood */}
        {avgMood !== null && (
          <div className="bg-slate-800/50 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average Mood</span>
              <span className="text-lg font-bold text-slate-200">{avgMood}/10 {getMoodEmoji(avgMood)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Trend: {moodTrend}</p>
          </div>
        )}

        {/* Daily activity chart */}
        {dailyActivity && (
          <div className="bg-slate-800/50 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-slate-500 mb-2">Daily Activity</p>
            <div className="flex items-end gap-1.5 h-20">
              {dailyActivity.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-violet-600 to-blue-500 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max(d.count * 5, 2)}%` }}
                  />
                  <span className="text-[9px] text-slate-600">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top topics */}
        {topTopics && topTopics.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-slate-500 mb-2">Top Topics</p>
            {topTopics.map(([topic, count], i) => (
              <div key={topic} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">{i + 1}. {getTopicLabel(topic)}</span>
                <span className="text-xs text-slate-500">{count} msgs</span>
              </div>
            ))}
          </div>
        )}

        {/* Text insights */}
        {textInsights && textInsights.length > 0 && (
          <div className="space-y-1.5 mt-3">
            {textInsights.map((insight, i) => (
              <p key={i} className="text-sm text-slate-300" dangerouslySetInnerHTML={{
                __html: insight.replace(/\*\*(.+?)\*\*/g, '<strong class="text-violet-300">$1</strong>')
              }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={color} />
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-200">{value}</p>
    </div>
  );
}

function getMoodEmoji(score) {
  if (score >= 8) return '😊';
  if (score >= 6) return '🙂';
  if (score >= 4) return '😐';
  return '😔';
}

function getTopicLabel(topic) {
  const labels = {
    work: '💼 Work', relationships: '💕 Relationships', mental_health: '🧠 Mental Health',
    hobbies: '🎮 Hobbies', learning: '📚 Learning', health: '🏥 Health',
    goals: '🎯 Goals', daily: '☀️ Daily', general: '💬 General',
  };
  return labels[topic] || topic;
}
