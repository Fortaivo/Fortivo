import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
}

// Zod schemas for comprehensive validation
export const EmailSchema = z.string().email('Invalid email address');

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const AssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['financial', 'physical', 'digital', 'other'], {
    errorMap: () => ({ message: 'Invalid asset type' })
  }),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  estimated_value: z.number().positive('Value must be positive').optional(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  beneficiary_id: z.string().uuid('Invalid beneficiary ID').optional(),
  acquisition_date: z.string().datetime('Invalid date format').optional(),
});

export const BeneficiarySchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  relationship: z.string().max(50, 'Relationship must be less than 50 characters').optional(),
  contact_email: z.string().email('Invalid email address').optional(),
  contact_phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
});

export const ProfileSchema = z.object({
  full_name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  avatar_url: z.string().url('Invalid URL format').optional(),
  subscription_tier: z.enum(['free', 'pro', 'premium']).optional(),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  acceptedTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

// Validation helper functions
export function validateAsset(data: unknown) {
  return AssetSchema.safeParse(data);
}

export function validateBeneficiary(data: unknown) {
  return BeneficiarySchema.safeParse(data);
}

export function validateProfile(data: unknown) {
  return ProfileSchema.safeParse(data);
}

export function validateLogin(data: unknown) {
  return LoginSchema.safeParse(data);
}

export function validateSignup(data: unknown) {
  return SignupSchema.safeParse(data);
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\(\)\+]/g, '');
}