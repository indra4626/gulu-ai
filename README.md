<div align="center">

# 🤖 GULU — Private AI Companion

**A security-first, encrypted AI companion built with React + Google Gemini API**

[![Deploy with Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://gulu-ai-sigma.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

<img src="https://img.shields.io/badge/AES--256-Encrypted-blueviolet?style=flat-square" /> <img src="https://img.shields.io/badge/PII-Auto--Redacted-orange?style=flat-square" /> <img src="https://img.shields.io/badge/Zero-Backend-brightgreen?style=flat-square" />

</div>

---

## ✨ What is GULU?

**GULU** is a private, security-first AI companion that runs entirely in your browser. She's warm, playful, emotionally intelligent — and every conversation is **AES-256 encrypted** before it ever touches storage.

Built as a study in how to architect a **secure, privacy-respecting AI agent** from the ground up.

---

## 🔐 Security Architecture

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| **Encryption** | Web Crypto API (AES-GCM 256-bit) | Encrypts all chat history before `localStorage` write |
| **PII Redaction** | Custom regex scanner | Auto-masks emails, API keys, SSNs, credit cards, phone numbers before they reach the AI |
| **Session Locking** | Inactivity timer (15 min) | Wipes decrypted data from RAM after idle timeout |
| **Zero Backend** | Client-only architecture | No server, no database — your data never leaves your device |
| **API Key Safety** | Stored in `localStorage` only | Key is sent only to Google's API over HTTPS, never to any other server |

---

## 🧠 Features

### 💬 Real AI Conversations
- Powered by **Google Gemini API** (2.5 Flash / Pro)
- Natural, warm, emotionally aware personality
- Automatic model fallback if one model is unavailable

### 🧠 Memory & Learning Brain
- **Learns about you** — extracts your name, interests, location, mood from conversation
- **Persistent profile** — remembers across sessions
- **Conversation summaries** — maintains context over long conversations

### 😊 Emotion System
- GULU displays real-time emotions based on conversation context
- States: Happy, Caring, Playful, Curious, Excited, Thinking, Warning
- Dynamic avatar color transitions

### 🛡️ PII Auto-Redaction
If you accidentally type sensitive info, GULU:
1. Detects it instantly (emails, API keys, credit cards, SSNs, phone numbers)
2. Masks it with `[REDACTED_*]` tags before sending to the AI
3. Shows a gentle warning: *"I'll remember this securely, but are you sure you want to share this?"*

### 🌍 Real-World Awareness
- Current time & date displayed in header
- Time-aware greetings (Good morning/evening/night)
- Contextual responses based on day of week

### 🔒 Auto-Lock
- Session locks after 15 minutes of inactivity
- Decrypted history wiped from memory
- Manual lock button always available

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS v4** | Styling (dark glassmorphic UI) |
| **Zustand** | State management (GULU's brain) |
| **Web Crypto API** | AES-GCM encryption |
| **Google Gemini API** | AI conversation engine |
| **Lucide React** | Icon system |
| **Vercel** | Deployment |

---

## 📁 Project Structure

```
src/
├── App.jsx                    # Main chat UI, settings, lock screen
├── services/
│   └── geminiApi.js           # Gemini API client with model fallback
├── store/
│   └── useGuluStore.js        # Zustand store (brain state management)
└── utils/
    ├── cryptoUtils.js         # AES-GCM encrypt/decrypt functions
    ├── guluPersonality.js     # System prompt & emotion detection
    ├── memoryManager.js       # Long-term memory & user profile
    └── piiScanner.js          # PII detection & masking
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
1. Open `http://localhost:5173` in your browser
2. Paste your Gemini API key in the Settings screen
3. Start chatting with GULU!

---

## 🌐 Deployment

GULU is deployed on Vercel. To deploy your own instance:

```bash
npm run build
npx vercel --prod
```

---

## 🔑 API Key Security

Your API key is:
- ✅ Stored in your browser's `localStorage` only
- ✅ Sent only to Google's API endpoint over HTTPS
- ✅ Never transmitted to any third-party server
- ✅ Never stored in source code or environment files
- ❌ Never logged, tracked, or collected

---

## 📜 License

This project is open source under the [MIT License](./LICENSE).

---

<div align="center">

**Built with 💜 and a focus on privacy**

*GULU — Your private AI companion who actually respects your data.*

</div>
