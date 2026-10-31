import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { UX_STRINGS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { ApiErrorEnvelope } from '@/lib/types';

/**
 * Typed application error class and HTTP error-envelope mapper.
 * Source: `.agents/rules/api-design.md`, `.agents/rules/code-conventions.md`, `.agents/rules/ux-states.md`.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'STALE_PRICE'
  | 'PURCHASE_BLOCKED'
  | 'DUPLICATE_APPLICATION'
  | 'SAME_USER_FORBIDDEN'
  | 'PREREQUISITE_MISSING'
  | 'OVERPAYMENT_BLOCKED'
  | 'ACCOUNT_LOCKED_24H'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly fields: Record<string, string[]> | undefined;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

export function handleApiError(
  error: unknown,
  requestId: string,
  route?: string,
): NextResponse<ApiErrorEnvelope> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, messages] of Object.entries(error.flatten().fieldErrors)) {
      if (Array.isArray(messages)) {
        fieldErrors[key] = messages;
      }
    }

    const body: ApiErrorEnvelope = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Check the highlighted fields and try again.',
        fields: fieldErrors,
        requestId,
      },
    };

    return NextResponse.json(body, {
      status: 422,
      headers: { 'x-request-id': requestId },
    });
  }

  if (error instanceof AppError) {
    logger.warn(error.message, {
      requestId,
      ...(route !== undefined ? { route } : {}),
      statusCode: error.statusCode,
      errorCode: error.code,
    });

    const body: ApiErrorEnvelope = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields !== undefined ? { fields: error.fields } : {}),
        requestId,
      },
    };

    return NextResponse.json(body, {
      status: error.statusCode,
      headers: { 'x-request-id': requestId },
    });
  }

  const unknownMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Unhandled API exception', {
    requestId,
    ...(route !== undefined ? { route } : {}),
    statusCode: 500,
    errorCode: 'INTERNAL_ERROR',
    metadata: { detail: unknownMessage },
  });

  const body: ApiErrorEnvelope = {
    error: {
      code: 'INTERNAL_ERROR',
      message: UX_STRINGS.GENERIC_SERVER_ERROR,
      requestId,
    },
  };

  return NextResponse.json(body, {
    status: 500,
    headers: { 'x-request-id': requestId },
  });
}

