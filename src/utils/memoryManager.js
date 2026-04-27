// src/utils/memoryManager.js
// Manages GULU's long-term memory about the user

const PROFILE_KEY = 'gulu_user_profile';
const SUMMARY_KEY = 'gulu_conversation_summary';

export const getUserProfile = () => {
    try {
        const data = localStorage.getItem(PROFILE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

export const saveUserProfile = (profile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getConversationSummary = () => {
    return localStorage.getItem(SUMMARY_KEY) || '';
};

export const saveConversationSummary = (summary) => {
    localStorage.setItem(SUMMARY_KEY, summary);
};

// Extract learnable info from user messages
export const extractUserInfo = (message) => {
    const info = {};
    const lower = message.toLowerCase();

    // Name detection
    const nameMatch = message.match(/(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+)/i);
    if (nameMatch) info.name = nameMatch[1];

    // Age
    const ageMatch = message.match(/(?:i'm|i am|my age is)\s+(\d{1,2})\s*(?:years|yrs)?/i);
    if (ageMatch) info.age = ageMatch[1];

    // City/Location
    const cityMatch = message.match(/(?:i live in|i'm from|i am from|based in|from)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
    if (cityMatch) info.location = cityMatch[1];

    // Hobby/Interest detection
    const hobbyMatch = message.match(/(?:i (?:like|love|enjoy|play|watch))\s+(.+?)(?:\.|,|!|$)/i);
    if (hobbyMatch) info.interest = hobbyMatch[1].trim();

    // Work/Study
    const workMatch = message.match(/(?:i (?:work|study|am a|am an))\s+(.+?)(?:\.|,|!|$)/i);
    if (workMatch) info.occupation = workMatch[1].trim();

    // Mood
    if (/(?:i feel|i'm feeling|feeling)\s+(?:sad|down|depressed|low|bad|awful)/i.test(lower)) info.currentMood = 'sad';
    if (/(?:i feel|i'm feeling|feeling)\s+(?:happy|great|good|amazing|wonderful)/i.test(lower)) info.currentMood = 'happy';
    if (/(?:stressed|anxious|worried|nervous|overwhelmed)/i.test(lower)) info.currentMood = 'stressed';

    return info;
};

// Merge new info into existing profile
export const updateProfile = (newInfo) => {
    if (Object.keys(newInfo).length === 0) return;

    const profile = getUserProfile();

    for (const [key, value] of Object.entries(newInfo)) {
        if (key === 'interest') {
            // Accumulate interests
            const existing = profile.interests || '';
            if (!existing.toLowerCase().includes(value.toLowerCase())) {
                profile.interests = existing ? `${existing}, ${value}` : value;
            }
        } else {
            profile[key] = value;
        }
    }

    profile.lastUpdated = new Date().toISOString();
    saveUserProfile(profile);
    return profile;
};

// Get/Save API key from localStorage
export const getApiKey = () => localStorage.getItem('gulu_api_key') || '';
export const saveApiKey = (key) => localStorage.setItem('gulu_api_key', key);
