/**
 * @module memoryManager (Expanded)
 * @description Enhanced profile system tracking detailed user information,
 * preferences, communication style, and life context.
 */

// ============ PROFILE EXTRACTION ============

const EXTRACTION_PATTERNS = [
  // Identity
  { key: 'name', patterns: [/(?:my name is|i'm|i am|call me|they call me)\s+([A-Z][a-z]+)/i] },
  { key: 'age', patterns: [/(?:i'm|i am)\s+(\d{1,2})\s*(?:years?\s*old|yrs)/i, /(?:age|aged)\s+(\d{1,2})/i] },
  { key: 'location', patterns: [/(?:i live in|i'm from|from|based in|located in|living in)\s+([A-Za-z\s]+?)(?:\.|,|!|$)/i] },
  { key: 'occupation', patterns: [/(?:i work as|i'm a|i am a|working as|my job is)\s+(.+?)(?:\.|,|!|$)/i, /(?:i work at|working at|employed at)\s+(.+?)(?:\.|,|!|$)/i] },
  { key: 'education', patterns: [/(?:i study|studying|i'm studying|majoring in)\s+(.+?)(?:\.|,|!|$)/i, /(?:i go to|enrolled at|attend)\s+(.+?)(?:\.|,|!|$)/i] },

  // Relationships
  { key: 'relationship', patterns: [/(?:my (?:girlfriend|boyfriend|partner|wife|husband|gf|bf)\s+(?:is|named)\s+)(.+?)(?:\.|,|!|$)/i] },
  { key: 'pet', patterns: [/(?:my (?:dog|cat|pet)\s+(?:is|named)\s+)(.+?)(?:\.|,|!|$)/i, /(?:i have a (?:dog|cat|pet)\s+(?:named|called)\s+)(.+?)(?:\.|,|!|$)/i] },
  { key: 'siblings', patterns: [/(?:i have)\s+(\d+)\s+(?:brothers?|sisters?|siblings?)/i] },

  // Preferences
  { key: 'favoriteFood', patterns: [/(?:i love eating|favorite food is|i love|i enjoy eating)\s+(.+?)(?:\.|,|!|$)/i] },
  { key: 'favoriteMusic', patterns: [/(?:i (?:love|like|listen to))\s+(.+?)\s*(?:music|songs?)/i] },
  { key: 'favoriteMovie', patterns: [/(?:my favorite (?:movie|film) is)\s+(.+?)(?:\.|,|!|$)/i] },

  // Goals & Dreams
  { key: 'dream', patterns: [/(?:my dream is|i dream of|i wish|i hope to)\s+(.+?)(?:\.|,|!|$)/i] },
  { key: 'currentGoal', patterns: [/(?:currently (?:working on|focused on|learning)|my current goal is)\s+(.+?)(?:\.|,|!|$)/i] },

  // Communication preferences
  { key: 'language', patterns: [/(?:i speak|my (?:native |first )?language is)\s+(.+?)(?:\.|,|!|$)/i] },
  { key: 'timezone', patterns: [/(?:my timezone is|i'm in)\s+(IST|EST|PST|GMT|UTC[+-]\d+)/i] },
];

/**
 * Extract structured user info from text.
 */
export const extractUserInfo = (text) => {
  const info = {};

  for (const { key, patterns } of EXTRACTION_PATTERNS) {
    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        info[key] = match[1].trim();
        break;
      }
    }
  }

  // Interest extraction (special — appends)
  const interestMatch = text.match(/(?:i (?:love|like|enjoy|am into|am passionate about))\s+(.+?)(?:\.|,|!|$)/i);
  if (interestMatch) {
    info.interest = interestMatch[1].trim();
  }

  // Mood extraction
  const moodPatterns = {
    happy: /(?:feeling (?:great|amazing|happy|wonderful|fantastic)|i'm so happy|best day)/i,
    sad: /(?:feeling (?:sad|down|low|terrible|awful)|i'm sad|worst day|crying)/i,
    stressed: /(?:feeling (?:stressed|overwhelmed|anxious|pressured)|so much stress|burning out)/i,
    excited: /(?:feeling (?:excited|thrilled|pumped)|can't wait|so exciting)/i,
    angry: /(?:feeling (?:angry|frustrated|mad|furious|annoyed)|so angry|pissed)/i,
    lonely: /(?:feeling (?:lonely|alone|isolated)|no one|nobody)/i,
    grateful: /(?:feeling (?:grateful|thankful|blessed)|thank god|so lucky)/i,
    confused: /(?:feeling (?:confused|lost|unsure|uncertain)|don't know what)/i,
  };

  for (const [mood, pattern] of Object.entries(moodPatterns)) {
    if (pattern.test(text)) {
      info.currentMood = mood;
      break;
    }
  }

  return info;
};

// ============ PROFILE MANAGEMENT ============

export const getUserProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('gulu_profile') || '{}');
  } catch { return {}; }
};

export const updateProfile = (newInfo) => {
  const profile = getUserProfile();
  for (const [key, value] of Object.entries(newInfo)) {
    if (key === 'interest') {
      const existing = profile.interests || '';
      if (!existing.toLowerCase().includes(value.toLowerCase())) {
        profile.interests = existing ? `${existing}, ${value}` : value;
      }
    } else {
      profile[key] = value;
    }
  }
  profile.lastUpdated = new Date().toISOString();
  localStorage.setItem('gulu_profile', JSON.stringify(profile));
  return profile;
};

export const getConversationSummary = () => {
  return localStorage.getItem('gulu_summary') || '';
};

export const saveConversationSummary = (summary) => {
  localStorage.setItem('gulu_summary', summary);
};

export const getApiKey = () => {
  return localStorage.getItem('gulu_api_key') || '';
};

export const saveApiKey = (key) => {
  localStorage.setItem('gulu_api_key', key);
};
