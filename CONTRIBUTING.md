# Contributing to GULU

Thank you for your interest in contributing to GULU! Here's how to get started.

## 🚀 Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/gulu-ai.git
cd gulu-ai

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local

# 4. Add your Gemini API key to .env.local (optional, can also set in UI)

# 5. Start dev server
npm run dev
```

## 📁 Project Structure

```
src/
├── App.jsx                    # Main UI — chat, settings, lock screen
├── services/
│   └── geminiApi.js           # Gemini API client (model fallback chain)
├── store/
│   └── useGuluStore.js        # Zustand store — GULU's brain state
└── utils/
    ├── cryptoUtils.js         # AES-GCM encrypt/decrypt (Web Crypto API)
    ├── guluPersonality.js     # System prompt builder & emotion detection
    ├── memoryManager.js       # User profile extraction & persistence
    └── piiScanner.js          # PII regex scanner & masking
```

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- `cryptoUtils.js` — encrypt/decrypt roundtrip, key generation, tamper detection
- `piiScanner.js` — email, phone, SSN, credit card, API key detection + edge cases

## 🔧 Development Guidelines

### Code Style
- Use **functional React components** with hooks
- State management via **Zustand** (no Redux, no Context API for global state)
- Use **Lucide React** for icons
- Follow existing file naming: `camelCase.js` for utilities, `PascalCase.jsx` for components

### Security Rules (Mandatory)
- **NEVER** hardcode API keys, tokens, or secrets
- **NEVER** log sensitive data to `console.log` in production
- **ALL** user input must pass through `piiScanner.js` before reaching the API
- **ALL** stored data must be encrypted via `cryptoUtils.js`
- New PII patterns must be added to `piiScanner.js` with corresponding tests

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add voice input support
fix: PII scanner missing Indian phone numbers
docs: update encryption section in SECURITY.md
test: add edge cases for credit card detection
```

## 🐛 Reporting Bugs

1. Check [existing issues](../../issues) first
2. Include: Browser, OS, steps to reproduce, expected vs actual behavior
3. **Never include your API key** in bug reports

## 💡 Feature Requests

Open an issue with the `enhancement` label. Describe:
- What problem does it solve?
- How should it work?
- Any security implications?

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
