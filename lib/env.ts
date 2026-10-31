import { z } from 'zod';

/**
 * Runtime environment variable schema and accessor.
 * Source: PRD Section 8.5 and `.agents/rules/env-and-secrets.md`.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NIN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'NIN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .optional(),
  PHONE_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'PHONE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .optional(),
  SMS_API_KEY: z.string().min(1).optional(),
  SMS_SENDER_ID: z.string().min(1).default('DGTechATF03'),
  CRON_SECRET: z.string().min(16).optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }
  return parsed.data;
}

export function isDatabaseConfigured(): boolean {
  const rawUrl = process.env['DATABASE_URL'];
  return typeof rawUrl === 'string' && rawUrl.trim().length > 0;
}

