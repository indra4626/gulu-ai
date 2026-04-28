// src/components/SidePanel.jsx
// Unified side panel for Topics, Memory Bank, and Reminders
import React, { useState, useEffect } from 'react';
import {
  X, MessageSquare, Brain, Bell, Pin, PinOff, Trash2,
  BookOpen, Target, Heart, Star, Award, ChevronRight,
  Calendar, Download, CheckCircle, Clock
} from 'lucide-react';
import { TOPIC_RULES } from '../utils/topicDetector';

const TABS = [
  { id: 'topics', label: 'Topics', icon: MessageSquare },
  { id: 'memories', label: 'Memories', icon: Brain },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

const CATEGORY_ICONS = {
  achievement: Award,
  emotional: Heart,
  milestone: Star,
  personal: BookOpen,
  general: Brain,
};

const CATEGORY_COLORS = {
  achievement: 'text-amber-400',
  emotional: 'text-pink-400',
  milestone: 'text-blue-400',
  personal: 'text-violet-400',
  general: 'text-slate-400',
};

export default function SidePanel({
  isOpen, onClose, topicStats, memories, reminders,
  onFilterTopic, activeFilter, onPinMemory, onDeleteMemory,
  onCompleteReminder, onExportMemories
}) {
  const [activeTab, setActiveTab] = useState('topics');

  if (!isOpen) return null;

  const allTopicLabels = {};
  TOPIC_RULES.forEach(r => { allTopicLabels[r.topic] = r.label; });
  allTopicLabels.general = '💬 General';

  const totalMessages = Object.values(topicStats || {}).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-50 flex flex-col msg-animate">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'topics' && (
            <TopicsView
              stats={topicStats}
              labels={allTopicLabels}
              total={totalMessages}
              onFilter={onFilterTopic}
              activeFilter={activeFilter}
            />
          )}
          {activeTab === 'memories' && (
            <MemoriesView
              memories={memories}
              onPin={onPinMemory}
              onDelete={onDeleteMemory}
              onExport={onExportMemories}
            />
          )}
          {activeTab === 'reminders' && (
            <RemindersView
              reminders={reminders}
              onComplete={onCompleteReminder}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ==================== TOPICS ====================
function TopicsView({ stats, labels, total, onFilter, activeFilter }) {
  const entries = Object.entries(stats || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-slate-500">{total} messages analyzed</p>

      {/* All filter */}
      <button
        onClick={() => onFilter(null)}
        className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between transition ${
          !activeFilter ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
        }`}
      >
        <span>📊 All Topics</span>
        <span className="text-xs text-slate-500">{total}</span>
      </button>

      {entries.map(([topic, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isActive = activeFilter === topic;

        return (
          <button
            key={topic}
            onClick={() => onFilter(isActive ? null : topic)}
            className={`w-full px-3 py-2.5 rounded-xl text-left text-sm transition ${
              isActive ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span>{labels[topic] || topic}</span>
              <span className="text-xs text-slate-500">{count} msgs</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-violet-500 to-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              You talk about this {pct}% of the time
            </p>
          </button>
        );
      })}

      {entries.length === 0 && (
        <p className="text-center text-slate-600 text-sm py-8">No conversations yet. Start chatting to see your topics!</p>
      )}
    </div>
  );
}

// ==================== MEMORIES ====================
function MemoriesView({ memories, onPin, onDelete, onExport }) {
  const pinned = (memories || []).filter(m => m.is_pinned);
  const auto = (memories || []).filter(m => !m.is_pinned);

  const groupByMonth = (items) => {
    const groups = {};
    items.forEach(m => {
      const key = new Date(m.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  };

  const autoGrouped = groupByMonth(auto);

  return (
    <div className="p-4 space-y-4">
      {/* Export button */}
      <button
        onClick={onExport}
        className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2 transition"
      >
        <Download size={14} /> Export Memories as Journal
      </button>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1"><Pin size={12} /> Pinned Memories</p>
          {pinned.map(m => (
            <MemoryCard key={m.id} memory={m} onPin={onPin} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* Auto-detected timeline */}
      {Object.entries(autoGrouped).map(([month, items]) => (
        <div key={month}>
          <p className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1"><Calendar size={12} /> {month}</p>
          {items.map(m => (
            <MemoryCard key={m.id} memory={m} onPin={onPin} onDelete={onDelete} />
          ))}
        </div>
      ))}

      {(memories || []).length === 0 && (
        <div className="text-center py-8">
          <Brain size={32} className="mx-auto text-slate-700 mb-2" />
          <p className="text-slate-600 text-sm">No memories yet</p>
          <p className="text-slate-700 text-xs mt-1">Pin messages or share important moments — GULU will remember!</p>
        </div>
      )}
    </div>
  );
}

function MemoryCard({ memory, onPin, onDelete }) {
  const Icon = CATEGORY_ICONS[memory.category] || Brain;
  const color = CATEGORY_COLORS[memory.category] || 'text-slate-400';
  const timeAgo = getTimeAgo(new Date(memory.created_at));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 mb-2 group">
      <div className="flex items-start gap-2">
        <Icon size={14} className={`mt-0.5 flex-shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 leading-relaxed">{memory.content}</p>
          <p className="text-[10px] text-slate-600 mt-1">{timeAgo}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onPin(memory.id, !memory.is_pinned)} className="text-slate-500 hover:text-amber-400 p-0.5">
            {memory.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button onClick={() => onDelete(memory.id)} className="text-slate-500 hover:text-red-400 p-0.5">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== REMINDERS ====================
function RemindersView({ reminders, onComplete }) {
  const upcoming = (reminders || []).filter(r => r.trigger_date && new Date(r.trigger_date) > new Date());
  const overdue = (reminders || []).filter(r => r.trigger_date && new Date(r.trigger_date) <= new Date());
  const noDate = (reminders || []).filter(r => !r.trigger_date);

  return (
    <div className="p-4 space-y-4">
      {overdue.length > 0 && (
        <div>
          <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1"><Clock size={12} /> Overdue</p>
          {overdue.map(r => <ReminderCard key={r.id} reminder={r} onComplete={onComplete} />)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1"><Bell size={12} /> Upcoming</p>
          {upcoming.map(r => <ReminderCard key={r.id} reminder={r} onComplete={onComplete} />)}
        </div>
      )}

      {noDate.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">Notes</p>
          {noDate.map(r => <ReminderCard key={r.id} reminder={r} onComplete={onComplete} />)}
        </div>
      )}

      {(reminders || []).length === 0 && (
        <div className="text-center py-8">
          <Bell size={32} className="mx-auto text-slate-700 mb-2" />
          <p className="text-slate-600 text-sm">No reminders yet</p>
          <p className="text-slate-700 text-xs mt-1">Tell GULU about goals, birthdays, or deadlines — she'll remember!</p>
        </div>
      )}
    </div>
  );
}

function ReminderCard({ reminder, onComplete }) {
  const typeEmojis = { birthday: '🎂', anniversary: '💍', goal: '🎯', deadline: '📅', health_goal: '💪', checkin: '💬' };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2">
      <span className="text-lg">{typeEmojis[reminder.reminder_type] || '📌'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{reminder.content}</p>
        {reminder.trigger_date && (
          <p className="text-[10px] text-slate-600">{new Date(reminder.trigger_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        )}
      </div>
      <button onClick={() => onComplete(reminder.id)} className="text-slate-600 hover:text-green-400 p-1 transition">
        <CheckCircle size={16} />
      </button>
    </div>
  );
}

// Helper
function getTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
