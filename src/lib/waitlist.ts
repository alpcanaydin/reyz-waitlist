export const WAITLIST_SHEET_DEFAULT_NAME = 'Waitlist';

export const waitlistErrorCodes = {
  captchaFailed: 'captcha_failed',
  invalidEmail: 'invalid_email',
  missingToken: 'missing_token',
  serverError: 'server_error',
} as const;

export type WaitlistErrorCode = (typeof waitlistErrorCodes)[keyof typeof waitlistErrorCodes];

export interface WaitlistErrorResponse {
  error: WaitlistErrorCode;
}

export interface WaitlistRequestBody {
  email: string;
  turnstileToken: string;
}

export type WaitlistResponse = WaitlistErrorResponse | WaitlistSuccessResponse;

export interface WaitlistSuccessResponse {
  ok: true;
}

const WAITLIST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isValidWaitlistEmail(email: string): boolean {
  return WAITLIST_EMAIL_REGEX.test(normalizeWaitlistEmail(email));
}

export function isWaitlistErrorResponse(payload: unknown): payload is WaitlistErrorResponse {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<WaitlistErrorResponse>;

  return typeof candidate.error === 'string';
}

export function normalizeWaitlistEmail(email: string): string {
  return email.trim();
}
