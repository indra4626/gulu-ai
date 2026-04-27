import { create } from 'zustand';
import { encryptData, decryptData, generateKey } from '../utils/cryptoUtils';

export const useGuluStore = create((set, get) => ({
  isLocked: false,
  cryptoKey: null,
  encryptedHistory: null, // Stored as base64 encrypted string
  currentEmotion: 'neutral', // 'neutral', 'happy', 'curious', 'thinking', 'excited', 'warning'
  lastActive: Date.now(),
  
  initializeCrypto: async () => {
    // Generates a new key per session for demo purposes.
    // In a real app with persistent storage, this key needs to be managed securely.
    const key = await generateKey();
    set({ cryptoKey: key });
    
    // Check local storage for existing history
    const storedHistory = localStorage.getItem('gulu_history');
    if (storedHistory) {
      set({ encryptedHistory: storedHistory });
    } else {
      // Initialize empty history and encrypt it
      const emptyHistory = JSON.stringify([]);
      const encrypted = await encryptData(key, emptyHistory);
      set({ encryptedHistory: encrypted });
      localStorage.setItem('gulu_history', encrypted);
    }
  },

  setEmotion: (emotion) => set({ currentEmotion: emotion }),

  updateActivity: () => set({ lastActive: Date.now() }),

  lockSession: () => set({ isLocked: true, currentEmotion: 'neutral' }),
  unlockSession: () => set({ isLocked: false, lastActive: Date.now() }),

  addMessage: async (message) => {
    const { cryptoKey, encryptedHistory } = get();
    if (!cryptoKey || !encryptedHistory || get().isLocked) return;

    try {
      // Decrypt
      const decryptedStr = await decryptData(cryptoKey, encryptedHistory);
      const history = JSON.parse(decryptedStr || '[]');
      
      // Add new message
      history.push(message);
      
      // Encrypt and save
      const newEncrypted = await encryptData(cryptoKey, JSON.stringify(history));
      set({ encryptedHistory: newEncrypted });
      localStorage.setItem('gulu_history', newEncrypted);
      
      // Keep session active
      get().updateActivity();
    } catch (e) {
      console.error("Failed to add message securely:", e);
    }
  },

  getDecryptedHistory: async () => {
    const { cryptoKey, encryptedHistory, isLocked } = get();
    if (!cryptoKey || !encryptedHistory || isLocked) return [];
    
    try {
      const decryptedStr = await decryptData(cryptoKey, encryptedHistory);
      return JSON.parse(decryptedStr || '[]');
    } catch (e) {
      console.error("Failed to decrypt history:", e);
      return [];
    }
  },

  clearMemory: async () => {
    const { cryptoKey } = get();
    if (!cryptoKey) return;
    const emptyHistory = JSON.stringify([]);
    const encrypted = await encryptData(cryptoKey, emptyHistory);
    set({ encryptedHistory: encrypted });
    localStorage.setItem('gulu_history', encrypted);
  }
}));
