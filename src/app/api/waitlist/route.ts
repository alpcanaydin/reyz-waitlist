import { NextResponse } from 'next/server';

import { appendWaitlistRow } from '@/src/lib/google-sheets';
import { verifyTurnstileToken } from '@/src/lib/turnstile';
import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
  type WaitlistErrorCode,
  waitlistErrorCodes,
} from '@/src/lib/waitlist';

export const runtime = 'nodejs';

interface WaitlistRequestPayload {
  email?: unknown;
  turnstileToken?: unknown;
}

export async function POST(request: Request) {
  let payload: WaitlistRequestPayload;

  try {
    payload = (await request.json()) as WaitlistRequestPayload;
  } catch {
    payload = {};
  }

  const email = typeof payload.email === 'string' ? normalizeWaitlistEmail(payload.email) : '';
  const turnstileToken =
    typeof payload.turnstileToken === 'string' ? payload.turnstileToken.trim() : '';

  if (!isValidWaitlistEmail(email)) {
    return createErrorResponse(waitlistErrorCodes.invalidEmail, 400);
  }

  if (!turnstileToken) {
    return createErrorResponse(waitlistErrorCodes.missingToken, 400);
  }

  try {
    const verification = await verifyTurnstileToken(turnstileToken, getRequestIp(request));

    if (!verification.success) {
      console.warn('Turnstile verification failed for waitlist signup', verification.errors);

      return createErrorResponse(waitlistErrorCodes.captchaFailed, 400);
    }

    await appendWaitlistRow({
      email,
      submittedAtUtc: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Waitlist signup failed', error);

    return createErrorResponse(waitlistErrorCodes.serverError, 500);
  }
}

function createErrorResponse(error: WaitlistErrorCode, status: number) {
  return NextResponse.json({ error }, { status });
}

function getRequestIp(request: Request): string | undefined {
  const cloudflareIp = request.headers.get('cf-connecting-ip');

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const realIp = request.headers.get('x-real-ip');

  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');

  return forwardedFor?.split(',')[0]?.trim() || undefined;
}
