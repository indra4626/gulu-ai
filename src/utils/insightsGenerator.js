/**
 * @module insightsGenerator
 * @description Generates weekly analytics and insights from conversation data.
 */

export const generateWeeklyInsights = (messages, moodEntries, topicStats, memories) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // Filter this week's data
  const weekMessages = (messages || []).filter(m => m.timestamp > weekStart.getTime());
  const weekMoods = (moodEntries || []).filter(m => new Date(m.created_at) > weekStart);
  const weekMemories = (memories || []).filter(m => new Date(m.created_at) > weekStart);

  // Message stats
  const userMsgs = weekMessages.filter(m => m.role === 'user');
  const guluMsgs = weekMessages.filter(m => m.role === 'gulu');

  // Topic breakdown this week
  const weekTopics = {};
  weekMessages.forEach(m => {
    const t = m.topic || 'general';
    weekTopics[t] = (weekTopics[t] || 0) + 1;
  });
  const topTopics = Object.entries(weekTopics).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Mood analysis
  const avgMood = weekMoods.length > 0
    ? Math.round(weekMoods.reduce((a, b) => a + b.mood_score, 0) / weekMoods.length * 10) / 10
    : null;
  const moodTrend = weekMoods.length >= 3
    ? getMoodTrend(weekMoods)
    : 'insufficient_data';

  // Daily distribution
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyActivity = Array(7).fill(0);
  weekMessages.forEach(m => {
    const day = new Date(m.timestamp).getDay();
    dailyActivity[day]++;
  });
  const mostActiveDay = dayNames[dailyActivity.indexOf(Math.max(...dailyActivity))];

  // Average message length
  const avgMsgLength = userMsgs.length > 0
    ? Math.round(userMsgs.reduce((a, m) => a + m.content.length, 0) / userMsgs.length)
    : 0;

  // Conversation streak
  const uniqueDays = new Set(weekMessages.map(m =>
    new Date(m.timestamp).toDateString()
  )).size;

  // Generate text insights
  const insights = [];

  if (userMsgs.length > 0) {
    insights.push(`📊 You sent **${userMsgs.length}** messages this week`);
  }
  if (avgMood !== null) {
    const moodEmoji = avgMood >= 7 ? '😊' : avgMood >= 5 ? '😐' : '😔';
    insights.push(`${moodEmoji} Average mood: **${avgMood}/10** (${moodTrend})`);
  }
  if (topTopics.length > 0) {
    insights.push(`💬 Top topic: **${getTopicLabel(topTopics[0][0])}** (${topTopics[0][1]} msgs)`);
  }
  if (mostActiveDay) {
    insights.push(`📅 Most active day: **${mostActiveDay}**`);
  }
  if (uniqueDays > 0) {
    insights.push(`🔥 ${uniqueDays}-day streak this week!`);
  }
  if (weekMemories.length > 0) {
    insights.push(`🧠 ${weekMemories.length} new ${weekMemories.length === 1 ? 'memory' : 'memories'} saved`);
  }

  return {
    weekStart: weekStart.toISOString(),
    messageCount: weekMessages.length,
    userMessageCount: userMsgs.length,
    guluMessageCount: guluMsgs.length,
    avgMsgLength,
    topTopics,
    avgMood,
    moodTrend,
    dailyActivity: dayNames.map((d, i) => ({ day: d, count: dailyActivity[i] })),
    mostActiveDay,
    uniqueDays,
    memoryCount: weekMemories.length,
    insights,
  };
};

function getMoodTrend(moods) {
  if (moods.length < 2) return 'stable';
  const firstHalf = moods.slice(0, Math.ceil(moods.length / 2));
  const secondHalf = moods.slice(Math.ceil(moods.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b.mood_score, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b.mood_score, 0) / secondHalf.length;
  if (avgSecond - avgFirst > 1) return 'improving 📈';
  if (avgFirst - avgSecond > 1) return 'declining 📉';
  return 'stable ➡️';
}

function getTopicLabel(topic) {
  const labels = {
    work: '💼 Work', relationships: '💕 Relationships', mental_health: '🧠 Mental Health',
    hobbies: '🎮 Hobbies', learning: '📚 Learning', health: '🏥 Health',
    goals: '🎯 Goals', daily: '☀️ Daily', general: '💬 General',
  };
  return labels[topic] || topic;
}
