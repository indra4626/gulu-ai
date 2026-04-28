/**
 * @module piiScanner
 * @description Scans user input for Personally Identifiable Information (PII) and masks
 * it before the text is sent to the AI API. This is a defense-in-depth measure — even if
 * the AI provider is trusted, we minimize the sensitive data that leaves the device.
 * 
 * **Detection Categories:** Email, API Keys (Google/OpenAI), Phone Numbers, US SSN, Credit Cards
 * 
 * **Known Limitations:**
 * - Context-dependent PII ("my address is 123 Main St") is not detected
 * - Non-English PII patterns are not covered
 * - Aadhaar (India) and passport numbers are not yet included
 * 
 * @see SECURITY.md for full pattern documentation
 */

/** @type {Array<{regex: RegExp, mask: string, category: string}>} */
const PII_PATTERNS = [
  // Email addresses
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, mask: "[REDACTED_EMAIL]", category: "email" },
  
  // Google API Keys (AIza...)
  { regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g, mask: "[REDACTED_GOOGLE_API_KEY]", category: "api_key" },
  
  // OpenAI API Keys (sk-...)
  { regex: /\b(sk-[a-zA-Z0-9]{32,})\b/g, mask: "[REDACTED_OPENAI_KEY]", category: "api_key" },
  
  // Phone numbers (international format, flexible)
  { regex: /\+?(\d{1,4})?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g, mask: "[REDACTED_PHONE]", category: "phone" },
  
  // US Social Security Numbers (XXX-XX-XXXX)
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, mask: "[REDACTED_SSN]", category: "ssn" },
  
  // Credit card numbers (13-16 digits, with optional spaces/dashes)
  { regex: /\b(?:\d[ -]*?){13,16}\b/g, mask: "[REDACTED_CREDIT_CARD]", category: "credit_card" }
];

/**
 * Scan text for sensitive PII patterns and replace them with safe masks.
 * 
 * @param {string} text - Raw user input to scan
 * @returns {{maskedText: string, hasSensitiveData: boolean, detectedCategories: string[]}}
 *   - maskedText: The input with all PII replaced by [REDACTED_*] tokens
 *   - hasSensitiveData: true if any PII was detected
 *   - detectedCategories: Array of matched category names (e.g., ['email', 'phone'])
 * 
 * @example
 * const result = maskSensitiveData("Email me at test@gmail.com");
 * // result.maskedText === "Email me at [REDACTED_EMAIL]"
 * // result.hasSensitiveData === true
 * // result.detectedCategories === ["email"]
 */
export const maskSensitiveData = (text) => {
  let maskedText = text;
  let hasSensitiveData = false;
  const detectedCategories = [];

  PII_PATTERNS.forEach(({ regex, mask, category }) => {
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;
    if (regex.test(maskedText)) {
      hasSensitiveData = true;
      detectedCategories.push(category);
      regex.lastIndex = 0;
      maskedText = maskedText.replace(regex, mask);
    }
  });

  return { maskedText, hasSensitiveData, detectedCategories };
};
