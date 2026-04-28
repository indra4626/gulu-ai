/**
 * @module proactiveEngine
 * @description Generates proactive suggestions based on user context, patterns, and history.
 */

/**
 * Generate proactive suggestions based on current context.
 */
export const getProactiveSuggestions = (profile, moodHistory, topicStats, reminders, projects) => {
  const suggestions = [];
  const now = new Date();
  const hour = now.getHours();

  // Time-based suggestions
  if (hour >= 22 || hour < 5) {
    suggestions.push({ type: 'wellness', text: "It's late — want me to help you wind down? 🌙", priority: 'low' });
  }
  if (hour >= 6 && hour <= 9) {
    suggestions.push({ type: 'planning', text: "Good morning! Want to plan today's priorities? 📋", priority: 'medium' });
  }

  // Mood-based
  if (moodHistory && moodHistory.length >= 3) {
    const recentMoods = moodHistory.slice(-3);
    const avgScore = recentMoods.reduce((a, b) => a + b.mood_score, 0) / recentMoods.length;
    if (avgScore <= 4) {
      suggestions.push({ type: 'emotional', text: "I've noticed you've been feeling down lately. Want to talk? 💜", priority: 'high' });
    }
    if (avgScore >= 8) {
      suggestions.push({ type: 'celebration', text: "You've been in great spirits! What's making things so good? ✨", priority: 'medium' });
    }
  }

  // Deadline reminders
  if (projects) {
    const urgentProjects = projects.filter(p => {
      if (!p.deadline || p.status !== 'active') return false;
      const daysLeft = Math.ceil((new Date(p.deadline) - now) / 86400000);
      return daysLeft >= 0 && daysLeft <= 3;
    });
    urgentProjects.forEach(p => {
      const daysLeft = Math.ceil((new Date(p.deadline) - now) / 86400000);
      suggestions.push({
        type: 'deadline',
        text: `⏰ "${p.name}" is due ${daysLeft === 0 ? 'TODAY' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}!`,
        priority: 'urgent',
      });
    });
  }

  // Upcoming reminders
  if (reminders) {
    const upcoming = reminders.filter(r => {
      if (!r.trigger_date || r.is_completed) return false;
      const daysLeft = Math.ceil((new Date(r.trigger_date) - now) / 86400000);
      return daysLeft >= 0 && daysLeft <= 2;
    });
    upcoming.forEach(r => {
      suggestions.push({ type: 'reminder', text: `📌 ${r.content}`, priority: 'high' });
    });
  }

  // Topic-based suggestions
  if (topicStats) {
    const topTopic = Object.entries(topicStats).sort((a, b) => b[1] - a[1])[0];
    if (topTopic && topTopic[1] > 20) {
      const topicSuggestions = {
        learning: "You've been learning a lot! Want a quiz or practice exercise? 📚",
        work: "You discuss work often. Want help organizing your priorities? 💼",
        mental_health: "Your wellbeing matters. Want to try a quick breathing exercise? 🧘",
        relationships: "Want to reflect on what matters most in your relationships? 💕",
        goals: "You have big goals! Let's break one down into steps? 🎯",
      };
      const suggestion = topicSuggestions[topTopic[0]];
      if (suggestion) {
        suggestions.push({ type: 'topic', text: suggestion, priority: 'low' });
      }
    }
  }

  // Profile-based
  if (profile?.currentGoal) {
    suggestions.push({ type: 'goal', text: `How's progress on "${profile.currentGoal}"? 🎯`, priority: 'medium' });
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions.slice(0, 3); // Max 3 suggestions
};

/**
 * Detect if GULU should proactively say something.
 */
export const shouldProactivelyEngage = (lastMessageTime, moodHistory) => {
  const hoursSinceLastMsg = (Date.now() - lastMessageTime) / 3600000;

  if (hoursSinceLastMsg > 48) return { engage: true, reason: 'miss_you' };
  if (hoursSinceLastMsg > 24) return { engage: true, reason: 'check_in' };

  if (moodHistory && moodHistory.length > 0) {
    const lastMood = moodHistory[moodHistory.length - 1];
    if (lastMood.mood_score <= 3 && hoursSinceLastMsg > 6) {
      return { engage: true, reason: 'emotional_support' };
    }
  }

  return { engage: false };
};
