const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerificationResult {
  errors: string[];
  success: boolean;
}

interface TurnstileSiteVerifyResponse {
  'error-codes'?: string[];
  success: boolean;
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerificationResult> {
  const formData = new URLSearchParams({
    response: token,
    secret: getTurnstileSecretKey(),
  });

  if (remoteIp) {
    formData.set('remoteip', remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
    body: formData,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Turnstile verification request failed with ${response.status}`);
  }

  const payload = (await response.json()) as TurnstileSiteVerifyResponse;

  return {
    errors: payload['error-codes'] ?? [],
    success: payload.success,
  };
}

function getTurnstileSecretKey(): string {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing TURNSTILE_SECRET_KEY');
  }

  return secretKey;
}
