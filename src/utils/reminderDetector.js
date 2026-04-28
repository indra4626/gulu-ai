/**
 * @module reminderDetector
 * @description Detects important dates, events, and goals from conversation to create smart reminders.
 */

/**
 * Detect important events/dates/goals from message text.
 * @param {string} text
 * @returns {Array<{type: string, content: string, triggerDate: Date|null}>}
 */
export const detectReminders = (text) => {
  const reminders = [];
  const lower = text.toLowerCase();

  // Birthday detection
  const bdayMatch = text.match(/(?:my )?birthday(?:\s+is)?(?:\s+on)?\s+(\w+ \d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+\w+)/i);
  if (bdayMatch) {
    reminders.push({
      type: 'birthday',
      content: `🎂 Your birthday: ${bdayMatch[1]}`,
      triggerDate: parseRelativeDate(bdayMatch[1]),
    });
  }
  if (/my birthday|born on|born in/i.test(lower) && !bdayMatch) {
    reminders.push({ type: 'birthday', content: '🎂 Mentioned birthday', triggerDate: null });
  }

  // Anniversary
  const anniMatch = text.match(/anniversary(?:\s+is)?(?:\s+on)?\s+(\w+ \d{1,2})/i);
  if (anniMatch) {
    reminders.push({
      type: 'anniversary',
      content: `💍 Anniversary: ${anniMatch[1]}`,
      triggerDate: parseRelativeDate(anniMatch[1]),
    });
  }

  // Goal/aspiration detection
  const goalPatterns = [
    /i want to (?:learn|start|begin|try) (.+?)(?:\.|!|$)/i,
    /my goal is (.+?)(?:\.|!|$)/i,
    /i plan to (.+?)(?:\.|!|$)/i,
    /i(?:'m| am) going to (.+?)(?:\.|!|$)/i,
    /i need to (.+?)(?:\.|!|$)/i,
  ];
  for (const pat of goalPatterns) {
    const match = text.match(pat);
    if (match) {
      reminders.push({
        type: 'goal',
        content: `🎯 Goal: ${match[1].trim()}`,
        triggerDate: addDays(new Date(), 7), // Remind in 7 days
      });
      break;
    }
  }

  // Exam/deadline detection
  const examMatch = text.match(/(?:exam|test|deadline|interview|meeting)(?:\s+is)?(?:\s+on)?\s+(\w+ \d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+\w+|tomorrow|next week)/i);
  if (examMatch) {
    reminders.push({
      type: 'deadline',
      content: `📅 ${examMatch[0].trim()}`,
      triggerDate: parseRelativeDate(examMatch[1]),
    });
  }

  // Health goal
  if (/(?:lose weight|gym|exercise|workout|diet|quit smoking|drink more water|sleep early)/i.test(lower)) {
    reminders.push({
      type: 'health_goal',
      content: `💪 Health goal mentioned`,
      triggerDate: addDays(new Date(), 3),
    });
  }

  return reminders;
};

/**
 * Detect moments worth saving as memories.
 */
export const detectMemoryMoment = (text) => {
  const lower = text.toLowerCase();

  // Achievements
  if (/(?:got promoted|got a raise|passed|graduated|got the job|accepted|won|achieved|completed|finished)/i.test(lower)) {
    return { category: 'achievement', summary: extractSummary(text, 'achievement') };
  }

  // Emotional moments
  if (/(?:happiest|best day|worst day|broke down|cried|never forget|changed my life|turning point|grateful)/i.test(lower)) {
    return { category: 'emotional', summary: extractSummary(text, 'emotional moment') };
  }

  // Milestones
  if (/(?:first time|first day|moved to|started|new|joined|left|quit|began)/i.test(lower)) {
    return { category: 'milestone', summary: extractSummary(text, 'milestone') };
  }

  // Secrets/deep sharing
  if (/(?:never told|secret|between us|don't tell|confession|embarrassing|afraid|scared|insecure)/i.test(lower)) {
    return { category: 'personal', summary: extractSummary(text, 'personal sharing') };
  }

  return null;
};

/**
 * Generate smart check-in message based on context.
 */
export const getCheckInMessage = (daysSinceLastChat, userProfile, memories) => {
  if (daysSinceLastChat >= 7) {
    return `Hey! It's been ${daysSinceLastChat} days... I was getting worried! 💜 Everything okay?`;
  }
  if (daysSinceLastChat >= 3) {
    return `Miss you! 💜 Haven't heard from you in ${daysSinceLastChat} days. What's new?`;
  }

  // Context-based check-ins
  const name = userProfile?.name || '';
  const mood = userProfile?.currentMood;

  if (mood === 'sad' || mood === 'stressed') {
    return `Hey${name ? ` ${name}` : ''}... How are you feeling today? I was thinking about you 🤗`;
  }

  const prompts = [
    "How's your day going so far? ☀️",
    "Anything interesting happen today? 😊",
    `Hey${name ? ` ${name}` : ''}! What's on your mind? 💭`,
    "Want to pick up where we left off? 💜",
  ];

  return prompts[Math.floor(Math.random() * prompts.length)];
};

// --- Helpers ---

function extractSummary(text, category) {
  const trimmed = text.slice(0, 120);
  return trimmed.length < text.length ? trimmed + '...' : trimmed;
}

function parseRelativeDate(str) {
  if (!str) return null;
  const lower = str.toLowerCase();
  if (lower === 'tomorrow') return addDays(new Date(), 1);
  if (lower === 'next week') return addDays(new Date(), 7);

  // Try parsing "Month Day" or "Day Month"
  try {
    const d = new Date(str + ', ' + new Date().getFullYear());
    if (!isNaN(d.getTime())) {
      if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  } catch {}
  return null;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
