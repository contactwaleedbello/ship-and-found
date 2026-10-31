/**
 * Zero-dependency structured JSON logger with automatic PII scrubbing.
 * Source: PRD Section 15.1 and `.agents/rules/observability-baseline.md`, `.agents/rules/security-baseline.md`.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntryContext {
  requestId?: string;
  actorId?: string;
  role?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = new Set([
  'nin',
  'phone',
  'phone_number',
  'phoneNumber',
  'guarantor_phone',
  'guarantorPhone',
  'password',
  'password_hash',
  'passwordHash',
  'otp',
  'token',
  'secret',
  'authorization',
  'cookie',
]);

function scrubMetadata(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      output[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      output[key] = scrubMetadata(value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function writeLog(level: LogLevel, message: string, context?: LogEntryContext): void {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: 'dg-tech-store',
    message,
  };

  if (context?.requestId !== undefined) payload['requestId'] = context.requestId;
  if (context?.actorId !== undefined) payload['actorId'] = context.actorId;
  if (context?.role !== undefined) payload['role'] = context.role;
  if (context?.route !== undefined) payload['route'] = context.route;
  if (context?.method !== undefined) payload['method'] = context.method;
  if (context?.statusCode !== undefined) payload['statusCode'] = context.statusCode;
  if (context?.durationMs !== undefined) payload['durationMs'] = context.durationMs;
  if (context?.errorCode !== undefined) payload['errorCode'] = context.errorCode;
  if (context?.metadata !== undefined) {
    payload['metadata'] = scrubMetadata(context.metadata);
  }

  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  debug(message: string, context?: LogEntryContext): void {
    writeLog('debug', message, context);
  },
  info(message: string, context?: LogEntryContext): void {
    writeLog('info', message, context);
  },
  warn(message: string, context?: LogEntryContext): void {
    writeLog('warn', message, context);
  },
  error(message: string, context?: LogEntryContext): void {
    writeLog('error', message, context);
  },
};

