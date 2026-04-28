# Privacy Policy — GULU AI Companion

**Last updated:** April 2026

## Summary

GULU collects **zero data on any server**. Everything stays in your browser.

## What Data GULU Processes

| Data | Where It's Stored | Who Can Access It |
|------|-------------------|------------------|
| Chat messages | Your browser's `localStorage` (AES-256 encrypted) | Only you |
| Your name, interests, mood | Your browser's `localStorage` | Only you |
| Gemini API key | Your browser's `localStorage` | Only you + Google's API |
| Conversation history | Your browser's `localStorage` (encrypted) | Only you |

## What Data Leaves Your Device

When you send a message, the **message text** (with PII auto-redacted) is sent to:
- **Google Generative AI API** (`generativelanguage.googleapis.com`) — to generate GULU's response

That's it. No other network requests are made. No analytics. No tracking. No cookies.

## What Google Sees

Google's Gemini API receives your (PII-redacted) messages for processing. Per [Google's API Terms](https://ai.google.dev/gemini-api/terms):
- API data is **not used to train models** (for paid & free tier API users)
- Google may log API requests for abuse prevention (standard for all API services)

## Data Deletion

To delete all GULU data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Clear all entries for the GULU domain

Or simply clear your browser data for the site.

## Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google Gemini API | AI responses | PII-redacted chat messages |
| Vercel | Hosting static files | None (static site, no server processing) |

## Contact

For privacy concerns, open an issue on the [GitHub repository](https://github.com/indra4626/gulu-ai).
