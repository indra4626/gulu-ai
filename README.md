<div align="center">

# 🤖 GULU — Private AI Companion

**A security-first, encrypted AI companion built with React + Google Gemini API**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-gulu--ai--sigma.vercel.app-blueviolet?style=for-the-badge)](https://gulu-ai-sigma.vercel.app)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-14_Passed-brightgreen?style=for-the-badge)](./src/__tests__/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<img src="https://img.shields.io/badge/AES--256-Encrypted-blueviolet?style=flat-square" /> <img src="https://img.shields.io/badge/PII-Auto--Redacted-orange?style=flat-square" /> <img src="https://img.shields.io/badge/Zero-Backend-brightgreen?style=flat-square" /> <img src="https://img.shields.io/badge/Chrome%20|%20Firefox%20|%20Edge%20|%20Safari-Supported-blue?style=flat-square" />

</div>

---

## 🌐 Try It Now

> **👉 [https://gulu-ai-sigma.vercel.app](https://gulu-ai-sigma.vercel.app)**
> 
> No installation needed. Open in any browser. Get a free [Gemini API key](https://aistudio.google.com/apikey) and start chatting.

---

## ✨ What is GULU?

**GULU** is a private, security-first AI companion that runs entirely in your browser. She's warm, playful, and emotionally intelligent — and every conversation is **AES-256 encrypted** before it touches storage.

### Why GULU Instead of ChatGPT / Claude?

| Feature | ChatGPT / Claude | GULU |
|---------|:---:|:---:|
| Conversations stored on their servers | ✅ | ❌ |
| Company can read your chats | ✅ | ❌ |
| PII auto-redaction before API call | ❌ | ✅ |
| Encrypted local storage | ❌ | ✅ |
| Auto-locks on inactivity | ❌ | ✅ |
| Learns your name/interests/mood | ❌ | ✅ |
| Open source & self-hostable | ❌ | ✅ |

---

## 🧠 Features

### 💬 Real AI Conversations
- Powered by **Google Gemini API** (2.5 Flash-Lite / Flash / Pro)
- Automatic model fallback — if one model is unavailable, GULU tries the next
- Warm, caring personality with emotional awareness

### 🧠 Memory & Learning Brain
GULU automatically learns about you from conversations:

| What She Learns | How She Detects It | Example |
|----------------|-------------------|---------|
| Your name | Pattern: "My name is..." / "I'm..." / "Call me..." | "I'm Raj" → stores `name: Raj` |
| Age | Pattern: "I'm X years old" | "I'm 22" → stores `age: 22` |
| Location | Pattern: "I live in..." / "I'm from..." | "I'm from Delhi" → stores `location: Delhi` |
| Interests | Pattern: "I like/love/enjoy..." | "I love coding" → stores `interests: coding` |
| Occupation | Pattern: "I work/study..." | "I study CS" → stores `occupation: study CS` |
| Mood | Sentiment patterns | "I feel stressed" → stores `currentMood: stressed` |

All stored **locally in your browser** — never uploaded anywhere.

### 😊 Emotion System
GULU displays real-time emotions based on conversation context:

| Emotion | Trigger | Visual |
|---------|---------|--------|
| 😊 Happy | Positive conversation, good news | Yellow-orange gradient |
| 🤗 Caring | User is sad, needs support | Pink-rose gradient |
| 😄 Playful | Jokes, light banter | Green-emerald gradient |
| 🤔 Curious | Learning about the user | Blue-cyan gradient |
| ✨ Excited | Achievements, celebrations | Amber-yellow gradient |
| 💭 Thinking | Processing response | Violet-purple gradient |
| 🛡️ Warning | PII detected | Orange-red gradient |

**Detection logic** (in `guluPersonality.js`): Regex patterns scan GULU's response text for emotional keywords and emoji, mapping them to the appropriate state.

### 🛡️ PII Auto-Redaction
If you type sensitive info, GULU catches it before it ever reaches Google:

```
You type:  "My email is john@gmail.com and SSN is 123-45-6789"
GULU sends: "My email is [REDACTED_EMAIL] and SSN is [REDACTED_SSN]"
```

**Detected patterns:** Emails, Google API keys, OpenAI keys, Phone numbers, US SSNs, Credit cards

> See [SECURITY.md](./SECURITY.md) for the full regex list and known gaps.

### 🌍 Real-World Awareness
- Current time & date in header
- Time-aware greetings (Good morning / evening / night)
- Day-of-week context in conversations

### 🔒 Auto-Lock (15 min)
- Session locks after 15 minutes of inactivity
- Decrypted history wiped from JavaScript heap
- Manual lock button always available

---

## 🔐 Security Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Encryption** | Web Crypto API — AES-GCM 256-bit | Encrypts chat history in localStorage |
| **PII Redaction** | Custom regex scanner (6 categories) | Masks sensitive data before API calls |
| **Session Lock** | 15-min inactivity timer | Wipes decrypted data from RAM |
| **Zero Backend** | Client-only static site | No server = no server-side data leak |
| **API Key Safety** | localStorage only | Never in source code, never logged |

> **Deep dive →** [SECURITY.md](./SECURITY.md) — Encryption method comparison, threat model, PII patterns, self-audit checklist.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS v4** | Dark glassmorphic UI |
| **Zustand** | State management (GULU's brain) |
| **Web Crypto API** | AES-GCM encryption |
| **Google Gemini API** | AI conversation engine |
| **Lucide React** | Icon system |
| **Vitest** | Unit testing |
| **Vercel** | Deployment |

### Browser Compatibility

| Browser | Supported | Reason |
|---------|:---------:|--------|
| Chrome 60+ | ✅ | Full Web Crypto API support |
| Firefox 57+ | ✅ | Full Web Crypto API support |
| Edge 79+ | ✅ | Chromium-based |
| Safari 14+ | ✅ | Web Crypto API support |
| IE 11 | ❌ | No Web Crypto API |

---

## 📁 Project Structure

```
gulu-ai/
├── src/
│   ├── App.jsx                    # Main UI — chat, settings, lock screen
│   ├── services/
│   │   └── geminiApi.js           # Gemini API client (model fallback)
│   ├── store/
│   │   └── useGuluStore.js        # Zustand store — brain state
│   ├── utils/
│   │   ├── cryptoUtils.js         # AES-GCM encrypt/decrypt (JSDoc)
│   │   ├── guluPersonality.js     # System prompt & emotion detection
│   │   ├── memoryManager.js       # User profile extraction & persistence
│   │   └── piiScanner.js          # PII detection & masking (JSDoc)
│   └── __tests__/
│       └── piiScanner.test.js     # 14 unit tests for PII scanner
├── SECURITY.md                    # Encryption docs, threat model, audit checklist
├── CONTRIBUTING.md                # Dev setup & contribution guidelines
├── PRIVACY.md                     # Privacy policy
├── .env.example                   # Environment variable template
└── README.md                      # You are here
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/indra4626/gulu-ai.git
cd gulu-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Setup
1. Open `http://localhost:5173`
2. Paste your Gemini API key in the Settings screen
3. Start chatting with GULU!

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-runs on file change)
npm run test:watch
```

---

## 🧪 Testing

| Test Suite | Tests | Coverage |
|-----------|:-----:|----------|
| PII Scanner | 14 ✅ | Emails, API keys, phone, SSN, safe text, multi-PII, categories |

### Verify Encryption Locally

Open browser DevTools → Console and run:
```js
// Check that localStorage contains encrypted (unreadable) data
console.log(localStorage.getItem('gulu_history'));
// Should output: a long Base64 string (not readable JSON)
```

---

## 🌐 Deployment

Deployed on Vercel (free tier). To deploy your own:

```bash
npm run build
npx vercel --prod
```

---

## 💡 Usage Examples

**Casual chat:**
> You: "Hey GULU, I had a rough day at work"
> GULU: "Aww, I'm sorry to hear that 😔 What happened? I'm here to listen. 💜"

**She learns about you:**
> You: "My name is Raj, I'm from Bangalore"
> GULU: "Nice to meet you, Raj! Bangalore is such a cool city. What do you do there? 🏙️"

**PII protection:**
> You: "My email is raj@company.com"
> GULU: "I noticed some sensitive info there. I'll keep it safe, but are you sure you want to share this? 🛡️"

**Time awareness:**
> (At 2 AM) GULU: "Hey, it's really late! Don't forget to rest, okay? 🌙"

---

## 🔑 API Key Security

| ✅ Safe | ❌ Never |
|---------|---------|
| Stored in your browser localStorage | Stored in source code |
| Sent only to Google API over HTTPS | Sent to any third-party |
| Deletable by clearing browser data | Logged or tracked |

---

## 🗺️ Roadmap

| Feature | Status |
|---------|--------|
| Real AI conversations via Gemini | ✅ Shipped |
| AES-256 encrypted storage | ✅ Shipped |
| PII auto-redaction (6 categories) | ✅ Shipped |
| Session auto-lock (15 min) | ✅ Shipped |
| Memory learning system | ✅ Shipped |
| Emotion detection & display | ✅ Shipped |
| Unit tests (PII scanner) | ✅ Shipped |
| Export/import encrypted chat backup | 🔜 Planned |
| Dark/light mode toggle | 🔜 Planned |
| Keyboard shortcuts (Ctrl+K) | 🔜 Planned |
| Voice input | 🔜 Planned |
| Aadhaar / Indian ID detection | 🔜 Planned |
| Configurable inactivity timeout | 🔜 Planned |
| PWA (installable on phone) | 🔜 Planned |

---

## ⚠️ Known Limitations

1. **Session-only encryption key** — encrypted history from a previous session can't be read in a new session (key is not persisted). This is a security trade-off.
2. **localStorage limit** — ~5MB per origin. Very long conversations may eventually hit this.
3. **Not real emotions** — GULU simulates emotional responses using pattern matching, not genuine feeling.
4. **English-only PII detection** — non-English sensitive data patterns are not scanned.
5. **Gemini free tier** — 1,500 requests/day, 15 requests/minute. Sufficient for personal use.
6. **No offline mode** — requires internet for AI responses (local memory works offline).

---

## 🔗 Links

- **Live Demo:** [gulu-ai-sigma.vercel.app](https://gulu-ai-sigma.vercel.app)
- **Security Docs:** [SECURITY.md](./SECURITY.md)
- **Privacy Policy:** [PRIVACY.md](./PRIVACY.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Get API Key:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## 📜 License

This project is open source under the [MIT License](./LICENSE).

---

<div align="center">

**Built with 💜 and a focus on privacy**

*GULU — Your private AI companion who actually respects your data.*

</div>
