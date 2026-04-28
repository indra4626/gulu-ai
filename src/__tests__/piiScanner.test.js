import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '../utils/piiScanner';

describe('PII Scanner', () => {
  // ==================== EMAIL ====================
  describe('Email Detection', () => {
    it('detects standard email addresses', () => {
      const result = maskSensitiveData('Contact me at user@gmail.com');
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_EMAIL]');
      expect(result.maskedText).not.toContain('user@gmail.com');
    });

    it('detects emails with dots and plus signs', () => {
      const result = maskSensitiveData('my.name+tag@company.co.in');
      expect(result.hasSensitiveData).toBe(true);
    });

    it('does not flag non-email @ usage', () => {
      const result = maskSensitiveData('I scored 10 @ the game');
      expect(result.hasSensitiveData).toBe(false);
    });
  });

  // ==================== API KEYS ====================
  describe('API Key Detection', () => {
    it('detects Google API keys (AIza...)', () => {
      const fakeKey = 'AIzaSyB' + 'a'.repeat(32);
      const result = maskSensitiveData(`My key is ${fakeKey}`);
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_GOOGLE_API_KEY]');
    });

    it('detects OpenAI API keys (sk-...)', () => {
      const fakeKey = 'sk-' + 'x'.repeat(40);
      const result = maskSensitiveData(`Key: ${fakeKey}`);
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_OPENAI_KEY]');
    });
  });

  // ==================== PHONE NUMBERS ====================
  describe('Phone Number Detection', () => {
    it('detects US format phone numbers', () => {
      const result = maskSensitiveData('Call me at 555-123-4567');
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_PHONE]');
    });

    it('detects international format', () => {
      const result = maskSensitiveData('My number is +91 987-654-3210');
      expect(result.hasSensitiveData).toBe(true);
    });
  });

  // ==================== SSN ====================
  describe('SSN Detection', () => {
    it('detects US Social Security Numbers', () => {
      const result = maskSensitiveData('My SSN is 123-45-6789');
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_SSN]');
    });

    it('does not flag regular dash-separated numbers', () => {
      const result = maskSensitiveData('Order #12-3');
      expect(result.hasSensitiveData).toBe(false);
    });
  });

  // ==================== SAFE TEXT ====================
  describe('Safe Text (No False Positives)', () => {
    it('passes normal conversational text', () => {
      const result = maskSensitiveData('Hey GULU, how are you today?');
      expect(result.hasSensitiveData).toBe(false);
      expect(result.maskedText).toBe('Hey GULU, how are you today?');
    });

    it('passes text with numbers that are not PII', () => {
      const result = maskSensitiveData('I scored 95 out of 100 in my exam');
      expect(result.hasSensitiveData).toBe(false);
    });

    it('passes URLs without flagging them', () => {
      const result = maskSensitiveData('Check out https://github.com/cool-project');
      expect(result.hasSensitiveData).toBe(false);
    });
  });

  // ==================== MULTIPLE PII ====================
  describe('Multiple PII in One Message', () => {
    it('detects and masks multiple PII types simultaneously', () => {
      const result = maskSensitiveData('Email user@test.com and call 555-123-4567');
      expect(result.hasSensitiveData).toBe(true);
      expect(result.maskedText).toContain('[REDACTED_EMAIL]');
      expect(result.maskedText).toContain('[REDACTED_PHONE]');
    });
  });

  // ==================== CATEGORIES ====================
  describe('Category Tracking', () => {
    it('returns detected categories', () => {
      const result = maskSensitiveData('Email: user@test.com');
      expect(result.detectedCategories).toContain('email');
    });
  });
});
