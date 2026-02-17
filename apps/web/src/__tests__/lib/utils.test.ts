import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, normalizePhoneNumber } from '@/lib/utils';

describe('Utils - Phone Number Formatting', () => {
  describe('formatPhoneNumber', () => {
    it('should format Brazilian phone number correctly', () => {
      expect(formatPhoneNumber('5511999887766')).toBe('+55 11 99988-7766');
      expect(formatPhoneNumber('5521987654321')).toBe('+55 21 98765-4321');
    });

    it('should handle numbers with country code', () => {
      expect(formatPhoneNumber('+5511999887766')).toBe('+55 11 99988-7766');
    });

    it('should return original value for invalid numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('')).toBe('');
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should convert to E.164 format', () => {
      expect(normalizePhoneNumber('(11) 99988-7766')).toBe('+5511999887766');
      expect(normalizePhoneNumber('11999887766')).toBe('+5511999887766');
    });

    it('should handle already formatted numbers', () => {
      expect(normalizePhoneNumber('+5511999887766')).toBe('+5511999887766');
    });

    it('should add country code if missing', () => {
      expect(normalizePhoneNumber('11999887766')).toBe('+5511999887766');
    });
  });
});
