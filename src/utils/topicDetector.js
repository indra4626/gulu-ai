/**
 * @module topicDetector
 * @description Auto-classifies messages into conversation topics using keyword matching.
 */

const TOPIC_RULES = [
  {
    topic: 'work',
    label: '💼 Work & Career',
    keywords: ['work', 'job', 'office', 'boss', 'salary', 'career', 'promotion', 'meeting', 'deadline', 'project', 'colleague', 'resign', 'hired', 'interview', 'company', 'manager', 'client', 'startup', 'business', 'freelance', 'remote work'],
  },
  {
    topic: 'relationships',
    label: '💕 Relationships',
    keywords: ['girlfriend', 'boyfriend', 'partner', 'wife', 'husband', 'crush', 'date', 'breakup', 'love', 'relationship', 'marriage', 'family', 'parents', 'mom', 'dad', 'brother', 'sister', 'friend', 'ex', 'argue', 'fight', 'miss you', 'lonely'],
  },
  {
    topic: 'mental_health',
    label: '🧠 Mental Health',
    keywords: ['anxious', 'anxiety', 'depressed', 'depression', 'stressed', 'stress', 'sad', 'crying', 'therapy', 'therapist', 'panic', 'overwhelmed', 'burnout', 'tired', 'exhausted', 'insomnia', 'sleep', 'self-care', 'meditation', 'mental health', 'feeling down', 'worried', 'overthinking'],
  },
  {
    topic: 'hobbies',
    label: '🎮 Hobbies & Fun',
    keywords: ['game', 'gaming', 'movie', 'music', 'song', 'book', 'reading', 'travel', 'trip', 'cooking', 'recipe', 'sport', 'gym', 'workout', 'fitness', 'art', 'drawing', 'painting', 'photography', 'anime', 'series', 'netflix', 'youtube', 'hobby', 'fun', 'weekend', 'party', 'concert'],
  },
  {
    topic: 'learning',
    label: '📚 Learning & Growth',
    keywords: ['learn', 'study', 'course', 'tutorial', 'coding', 'programming', 'python', 'javascript', 'college', 'university', 'exam', 'skill', 'certificate', 'practice', 'education', 'school', 'homework', 'lecture', 'research', 'knowledge', 'understand', 'teach me', 'how to', 'explain'],
  },
  {
    topic: 'health',
    label: '🏥 Health & Wellness',
    keywords: ['doctor', 'hospital', 'medicine', 'sick', 'fever', 'headache', 'pain', 'diet', 'weight', 'exercise', 'vitamins', 'health', 'healthy', 'injury', 'allergy', 'vaccine'],
  },
  {
    topic: 'goals',
    label: '🎯 Goals & Plans',
    keywords: ['goal', 'plan', 'want to', 'dream', 'future', 'resolution', 'achieve', 'target', 'ambition', 'bucket list', 'someday', 'wish', 'hope', 'aspire', 'next year', 'this month'],
  },
  {
    topic: 'daily',
    label: '☀️ Daily Life',
    keywords: ['morning', 'today', 'yesterday', 'tomorrow', 'lunch', 'dinner', 'breakfast', 'weather', 'shopping', 'errands', 'commute', 'chores', 'routine', 'daily'],
  },
];

/**
 * Detect the topic of a message.
 * @param {string} text - Message content
 * @returns {{topic: string, label: string, confidence: number}}
 */
export const detectTopic = (text) => {
  const lower = text.toLowerCase();
  let bestMatch = { topic: 'general', label: '💬 General', confidence: 0 };

  for (const rule of TOPIC_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestMatch.confidence) {
      bestMatch = { topic: rule.topic, label: rule.label, confidence: score };
    }
  }

  return bestMatch;
};

/**
 * Get topic stats from a list of messages.
 * @param {Array} messages
 * @returns {Array<{topic: string, label: string, count: number}>}
 */
export const getTopicStats = (messages) => {
  const counts = {};
  const labels = { general: '💬 General' };

  TOPIC_RULES.forEach(r => { labels[r.topic] = r.label; });

  messages.forEach(msg => {
    const t = msg.topic || 'general';
    counts[t] = (counts[t] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([topic, count]) => ({ topic, label: labels[topic] || topic, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Generate a related question based on topic.
 */
export const getRelatedQuestion = (topic) => {
  const questions = {
    work: "Want to talk more about your career goals? 🎯",
    relationships: "Want to share more about what's on your heart? 💕",
    mental_health: "Would it help to talk about how you're feeling? 🤗",
    hobbies: "Want to explore more fun activities together? 🎮",
    learning: "Shall I help you with something you're studying? 📚",
    health: "Want to discuss your wellness routine? 🏥",
    goals: "Want to brainstorm your next steps? 🚀",
    daily: "Anything interesting planned for later? ☀️",
  };
  return questions[topic] || null;
};

export { TOPIC_RULES };
