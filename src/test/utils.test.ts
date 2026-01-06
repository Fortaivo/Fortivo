import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/currency';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null);
      expect(result).toBe('base');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as currency', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('1,000');
      expect(result).toContain('$');
    });

    it('should handle different currencies', () => {
      const usd = formatCurrency(1000, 'USD');
      const eur = formatCurrency(1000, 'EUR');

      expect(usd).toContain('$');
      expect(eur).toContain('€');
    });

    it('should handle zero value', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toContain('0');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-500, 'USD');
      expect(result).toContain('-');
      expect(result).toContain('500');
    });
  });
});
