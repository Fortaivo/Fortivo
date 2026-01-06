import { describe, it, expect } from 'vitest';
import { 
  validateAsset, 
  validateBeneficiary, 
  validateLogin, 
  validateSignup,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone
} from '../lib/validation';

describe('Validation Functions', () => {
  describe('validateAsset', () => {
    it('should validate a valid asset', () => {
      const validAsset = {
        name: 'Test Asset',
        type: 'financial' as const,
        description: 'A test asset',
        estimated_value: 1000,
        location: 'Test Location',
      };

      const result = validateAsset(validAsset);
      expect(result.success).toBe(true);
    });

    it('should reject asset without name', () => {
      const invalidAsset = {
        type: 'financial' as const,
        description: 'A test asset',
      };

      const result = validateAsset(invalidAsset);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Required');
    });

    it('should reject invalid asset type', () => {
      const invalidAsset = {
        name: 'Test Asset',
        type: 'invalid' as any,
      };

      const result = validateAsset(invalidAsset);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Invalid asset type');
    });
  });

  describe('validateBeneficiary', () => {
    it('should validate a valid beneficiary', () => {
      const validBeneficiary = {
        full_name: 'John Doe',
        relationship: 'Son',
        contact_email: 'john@example.com',
        contact_phone: '+1234567890',
      };

      const result = validateBeneficiary(validBeneficiary);
      expect(result.success).toBe(true);
    });

    it('should reject beneficiary without full name', () => {
      const invalidBeneficiary = {
        relationship: 'Son',
        contact_email: 'john@example.com',
      };

      const result = validateBeneficiary(invalidBeneficiary);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Required');
    });
  });

  describe('validateLogin', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateLogin(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = validateLogin(invalidLogin);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Invalid email address');
    });
  });

  describe('validateSignup', () => {
    it('should validate valid signup data', () => {
      const validSignup = {
        email: 'test@example.com',
        password: 'Password123!',
        acceptedTerms: true,
      };

      const result = validateSignup(validSignup);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidSignup = {
        email: 'test@example.com',
        password: 'weak',
        acceptedTerms: true,
      };

      const result = validateSignup(invalidSignup);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('at least 8 characters');
    });

    it('should reject when terms not accepted', () => {
      const invalidSignup = {
        email: 'test@example.com',
        password: 'Password123!',
        acceptedTerms: false,
      };

      const result = validateSignup(invalidSignup);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('accept the terms');
    });
  });

  describe('Sanitization Functions', () => {
    it('should sanitize strings', () => {
      expect(sanitizeString('  test<script>alert("xss")</script>  ')).toBe('testalert("xss")');
      expect(sanitizeString('normal text')).toBe('normal text');
    });

    it('should sanitize emails', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });

    it('should sanitize phone numbers', () => {
      expect(sanitizePhone('+1 (234) 567-8900')).toBe('+1 (234) 567-8900');
      expect(sanitizePhone('1234567890')).toBe('1234567890');
      expect(sanitizePhone('123-456-7890')).toBe('123-456-7890');
    });
  });
});
