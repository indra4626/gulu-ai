# Security Policy — GULU AI Companion

## 🔐 Encryption Method: AES-GCM

### Why AES-GCM?

GULU uses **AES-GCM (Galois/Counter Mode)** with 256-bit keys via the Web Crypto API. Here's why:

| Method | Confidentiality | Integrity | Auth | Performance | GULU Choice |
|--------|:-:|:-:|:-:|:-:|:-:|
| **AES-GCM** | ✅ | ✅ | ✅ | Fast | ✅ Selected |
| AES-CBC | ✅ | ❌ | ❌ | Fast | ❌ No integrity check |
| AES-CTR | ✅ | ❌ | ❌ | Fast | ❌ No integrity check |
| ChaCha20-Poly1305 | ✅ | ✅ | ✅ | Fast | ❌ No Web Crypto support |
| RSA-OAEP | ✅ | ✅ | ✅ | Slow | ❌ Overkill for local storage |

**AES-GCM provides authenticated encryption** — it guarantees both confidentiality (nobody can read the data) AND integrity (nobody can tamper with it without detection). AES-CBC, by contrast, only provides confidentiality and is vulnerable to padding oracle attacks.

### Key Management

- A **new CryptoKey** is generated per browser session using `crypto.subtle.generateKey()`
- The key is held **in memory only** — it is never persisted to disk
- When the session locks (15-min inactivity), the key reference is dropped from RAM
- A fresh **12-byte IV (Initialization Vector)** is generated for each encryption operation via `crypto.getRandomValues()`
- IV is prepended to ciphertext for decryption

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Someone reads localStorage | Data is AES-256 encrypted — unreadable without the session key |
| Tampered ciphertext | GCM authentication tag detects modification |
| Key extraction from memory | Session auto-locks after 15 min, wiping key from JS heap |
| XSS attack reads localStorage | Encrypted data is useless without the in-memory key |
| Network interception | API calls use HTTPS; no plaintext data in transit |

### Limitations (Honest Assessment)

- The encryption key is **not derived from a user password** — it's session-only. This means encrypted history from a previous session cannot be decrypted in a new session unless key derivation (PBKDF2) is implemented in the future.
- `localStorage` has a **~5MB limit** per origin.
- This is **client-side security** — it protects against casual snooping, not a determined attacker with full device access.

---

## 🕵️ PII Detection Patterns

GULU scans every outgoing message against these patterns before it reaches the AI API:

| Category | Pattern | Example Match | Masked As |
|----------|---------|--------------|-----------|
| Email | `[a-z]+@[a-z]+\.[a-z]{2,}` | `user@gmail.com` | `[REDACTED_EMAIL]` |
| Google API Key | `AIza[0-9A-Za-z-_]{35}` | `AIzaSyB...` | `[REDACTED_GOOGLE_API_KEY]` |
| OpenAI API Key | `sk-[a-zA-Z0-9]{32,}` | `sk-abc123...` | `[REDACTED_OPENAI_KEY]` |
| Phone Number | `+?(\d{1,4})?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}` | `+91 98765 43210` | `[REDACTED_PHONE]` |
| US SSN | `\d{3}-\d{2}-\d{4}` | `123-45-6789` | `[REDACTED_SSN]` |
| Credit Card | `(?:\d[ -]*?){13,16}` | `4111 1111 1111 1111` | `[REDACTED_CREDIT_CARD]` |

### Known Gaps
- Aadhaar numbers (India) are not yet detected
- Passport numbers are not pattern-matched
- PII in non-English text is not scanned
- Context-dependent PII (e.g., "my address is...") is not detected

---

## ⏱️ Session Timeout: Why 15 Minutes?

The 15-minute inactivity timeout was chosen based on:

1. **NIST SP 800-63B** recommends 15-minute idle timeout for moderate-security sessions
2. **Banking apps** typically use 5–15 minutes
3. **Balance**: Short enough to protect if you walk away, long enough to not be annoying during normal use

> **Future**: This will become user-configurable in Settings.

---

## 🐛 Reporting Vulnerabilities

If you discover a security vulnerability in GULU:

1. **Do NOT open a public issue**
2. Email: Create a private security advisory via GitHub's [Security tab](../../security/advisories/new)
3. Include: Steps to reproduce, affected component, potential impact
4. Expected response time: 48 hours

---

## 🔍 Self-Audit Checklist

Run this checklist to verify GULU's security on your instance:

- [ ] Open DevTools → Application → Local Storage — verify data is base64-encoded gibberish (encrypted)
- [ ] Type an email address in chat → verify it shows `[REDACTED_EMAIL]` in the sent message
- [ ] Open DevTools → Network tab → verify API calls only go to `generativelanguage.googleapis.com`
- [ ] Leave GULU idle for 15+ minutes → verify it auto-locks
- [ ] Check page source → verify no API keys or personal data in the HTML/JS bundle
