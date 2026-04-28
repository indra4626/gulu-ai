/**
 * @module cryptoUtils
 * @description AES-GCM encryption using PBKDF2-derived keys from user's password.
 * Same password always produces the same key → data persists across sessions.
 */

const ALGO = 'AES-GCM';
const SALT = 'gulu-ai-2026-salt'; // Static salt (acceptable for single-user app)

/**
 * Derive a consistent AES-256 key from a user's password using PBKDF2.
 * Same password → same key every time → can decrypt old data.
 */
export const deriveKey = async (password) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt plaintext string using AES-GCM with a derived key.
 */
export const encryptData = async (key, data) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode.apply(null, combined));
};

/**
 * Decrypt a Base64-encoded AES-GCM ciphertext.
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

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
};
