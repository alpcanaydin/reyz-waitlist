import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';

import { appendWaitlistRow } from '@/src/lib/google-sheets';
import { verifyTurnstileToken } from '@/src/lib/turnstile';
import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
  type WaitlistErrorCode,
  waitlistErrorCodes,
} from '@/src/lib/waitlist';

export const runtime = 'nodejs';

const TICKET_CODE_ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
] as const;
const TICKET_CODE_LENGTH = 8;
const TICKET_CODE_PREFIX = 'REYZ';

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

    const submittedAtUtc = new Date().toISOString();
    const ticketCode = generateTicketCode();

    await appendWaitlistRow({
      email,
      submittedAtUtc,
      ticketCode,
    });

    return NextResponse.json({ email, ok: true, ticketCode });
  } catch (error) {
    console.error('Waitlist signup failed', error);

    return createErrorResponse(waitlistErrorCodes.serverError, 500);
  }
}

function createErrorResponse(error: WaitlistErrorCode, status: number) {
  return NextResponse.json({ error }, { status });
}

function generateTicketCode(): string {
  let codeBody = '';

  for (let index = 0; index < TICKET_CODE_LENGTH; index += 1) {
    codeBody += TICKET_CODE_ALPHABET[randomInt(TICKET_CODE_ALPHABET.length)]!;
  }

  return `${TICKET_CODE_PREFIX}-${codeBody.slice(0, 4)}-${codeBody.slice(4)}`;
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
