import { z } from 'zod';

/**
 * Task 4 Boundary Schema Validation
 * Enforces all Task 3 client-side rules at the server boundary.
 * Source: docs/validation-rules.md & docs/validation-placement.md
 */

export const serverRegisterSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(3, 'Full name must be at least 3 characters long.')
    .max(100, 'Full name must not exceed 100 characters.')
    .refine(
      (val) => val.split(/\s+/).filter(Boolean).length >= 2,
      'Full legal name must contain at least two words separated by a space (first and last name per BVN/NIN).'
    ),

  phoneNumber: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .regex(
      /^\+234[789][01]\d{8}$/,
      'Enter a valid Nigerian phone number in +234 international format (e.g., +2348031234567).'
    ),

  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address in the format name@domain.com.'),

  password: z
    .string({ required_error: 'Password is required.' })
    .trim()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must not exceed 128 characters.'),

  nin: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'National Identification Number (NIN) must be exactly 11 numeric digits.')
    .optional(),

  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must review and accept the Banex Plaza Shop ATF 03 Flexi-Pay terms.' }),
  }),
});

export const serverLoginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.'),

  password: z
    .string({ required_error: 'Password is required.' })
    .trim()
    .min(1, 'Password is required.'),
});

export const serverResetRequestSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.'),
});

export const serverVerifyCodeSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email(),
  code: z
    .string({ required_error: 'Verification code is required.' })
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 numeric digits.'),
});

export type ServerRegisterInput = z.infer<typeof serverRegisterSchema>;
export type ServerLoginInput = z.infer<typeof serverLoginSchema>;
export type ServerResetRequestInput = z.infer<typeof serverResetRequestSchema>;
export type ServerVerifyCodeInput = z.infer<typeof serverVerifyCodeSchema>;
