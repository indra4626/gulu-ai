// src/utils/piiScanner.js

const PII_PATTERNS = [
  // Email
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, mask: "[REDACTED_EMAIL]" },
  
  // API Keys (Basic heuristic for common keys like AIza... or sk-...)
  { regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g, mask: "[REDACTED_GOOGLE_API_KEY]" },
  { regex: /\b(sk-[a-zA-Z0-9]{32,})\b/g, mask: "[REDACTED_OPENAI_KEY]" },
  
  // Phone numbers (Generic international format)
  { regex: /\+?(\d{1,4})?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g, mask: "[REDACTED_PHONE]" },
  
  // SSN (US)
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, mask: "[REDACTED_SSN]" },
  
  // Credit Cards
  { regex: /\b(?:\d[ -]*?){13,16}\b/g, mask: "[REDACTED_CREDIT_CARD]" }
];

export const maskSensitiveData = (text) => {
  let maskedText = text;
  let hasSensitiveData = false;

  PII_PATTERNS.forEach(({ regex, mask }) => {
    if (regex.test(maskedText)) {
      hasSensitiveData = true;
      maskedText = maskedText.replace(regex, mask);
    }
  });

  return { maskedText, hasSensitiveData };
};
