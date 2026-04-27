// src/utils/cryptoUtils.js

// Generate a random key and IV for AES-GCM encryption.
// In a real app, you might derive the key from a user password using PBKDF2 or scrypt,
// and store it securely (or not store it persistently and ask the user to input it).
// For this demo, we'll generate a key and store it in memory/sessionStorage.

const ALGO = "AES-GCM";

export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGO,
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (key, data) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ALGO,
      iv: iv,
    },
    key,
    encoded
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode.apply(null, combined));
};

export const decryptData = async (key, encryptedBase64) => {
  try {
    const combinedStr = atob(encryptedBase64);
    const combined = new Uint8Array(combinedStr.length);
    for (let i = 0; i < combinedStr.length; i++) {
      combined[i] = combinedStr.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGO,
        iv: iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
