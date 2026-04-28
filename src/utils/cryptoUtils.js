/**
 * @module cryptoUtils
 * @description AES-GCM (256-bit) encryption/decryption utilities using the Web Crypto API.
 * 
 * **Why AES-GCM?**
 * - Provides authenticated encryption (confidentiality + integrity)
 * - Native browser support via Web Crypto API (no external dependencies)
 * - 12-byte IV generated per operation prevents nonce reuse
 * 
 * **Storage Format:** Base64( IV[12 bytes] || Ciphertext[N bytes] || AuthTag[16 bytes] )
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
 */

const ALGO = "AES-GCM";

/**
 * Generate a new AES-GCM 256-bit CryptoKey.
 * Key is extractable and supports both encrypt/decrypt operations.
 * 
 * @returns {Promise<CryptoKey>} A new AES-GCM key
 * @example
 * const key = await generateKey();
 */
export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypt a plaintext string using AES-GCM.
 * A fresh 12-byte IV is generated for each call and prepended to the output.
 * 
 * @param {CryptoKey} key - The AES-GCM key from generateKey()
 * @param {string} data - Plaintext string to encrypt
 * @returns {Promise<string>} Base64-encoded string containing IV + ciphertext
 * @throws {Error} If encryption fails
 * 
 * @example
 * const encrypted = await encryptData(key, JSON.stringify(messages));
 * localStorage.setItem('history', encrypted);
 */
export const encryptData = async (key, data) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  // Combine: [IV (12 bytes)] [Ciphertext + AuthTag]
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode.apply(null, combined));
};

/**
 * Decrypt a Base64-encoded AES-GCM ciphertext back to plaintext.
 * Extracts the IV from the first 12 bytes, then decrypts the remainder.
 * 
 * @param {CryptoKey} key - The same AES-GCM key used for encryption
 * @param {string} encryptedBase64 - Base64 string from encryptData()
 * @returns {Promise<string|null>} Decrypted plaintext, or null if decryption fails
 * 
 * @example
 * const json = await decryptData(key, localStorage.getItem('history'));
 * const messages = JSON.parse(json);
 */
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
      { name: ALGO, iv },
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
