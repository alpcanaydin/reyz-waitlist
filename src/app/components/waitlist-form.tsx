'use client';

import type { FormEvent } from 'react';

import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import {
  isValidWaitlistEmail,
  isWaitlistErrorResponse,
  normalizeWaitlistEmail,
  type WaitlistErrorCode,
  waitlistErrorCodes,
} from '@/src/lib/waitlist';

interface Props {
  className?: string;
  dark?: boolean;
}

type WaitlistStatus = 'error' | 'idle' | 'submitting' | 'success';

const TURNSTILE_SCRIPT_SOURCE =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

let turnstileScriptPromise: null | Promise<void> = null;

export default function WaitlistForm({ className, dark }: Props) {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const [turnstileReady, setTurnstileReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const rejectTokenRef = useRef<((message: string) => void) | null>(null);
  const resolveTokenRef = useRef<((token: string) => void) | null>(null);
  const turnstileFailedRef = useRef(false);
  const widgetIdRef = useRef<null | string>(null);

  async function requestTurnstileToken(): Promise<string> {
    const turnstile = window.turnstile;
    const widgetId = widgetIdRef.current;

    if (!turnstile || !widgetId) {
      throw new Error('Turnstile is not ready.');
    }

    rejectPendingToken(
      rejectTokenRef,
      resolveTokenRef,
      'Verification was interrupted. Please try again.',
    );

    return new Promise((resolve, reject) => {
      rejectTokenRef.current = (message: string) => reject(new Error(message));
      resolveTokenRef.current = resolve;

      turnstile.reset(widgetId);
      turnstile.execute(widgetId);
    });
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      rejectPendingToken(
        rejectTokenRef,
        resolveTokenRef,
        'Verification was interrupted. Please try again.',
      );

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      turnstileFailedRef.current = true;

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          action: 'waitlist_signup',
          callback: (token: string) => {
            resolvePendingToken(rejectTokenRef, resolveTokenRef, token);
          },
          execution: 'execute',
          'error-callback': () => {
            rejectPendingToken(
              rejectTokenRef,
              resolveTokenRef,
              'Could not verify the submission. Please try again.',
            );

            return true;
          },
          'expired-callback': () => {
            rejectPendingToken(
              rejectTokenRef,
              resolveTokenRef,
              'Verification expired. Please try again.',
            );
          },
          sitekey: TURNSTILE_SITE_KEY,
          'timeout-callback': () => {
            rejectPendingToken(
              rejectTokenRef,
              resolveTokenRef,
              'Verification timed out. Please try again.',
            );
          },
        });

        if (isMountedRef.current) {
          setTurnstileReady(true);
        }
      } catch {
        turnstileFailedRef.current = true;

        if (isMountedRef.current) {
          setTurnstileReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeWaitlistEmail(email);

    if (!isValidWaitlistEmail(normalizedEmail)) {
      setErrorMessage(getErrorMessage(waitlistErrorCodes.invalidEmail));
      setStatus('error');

      return;
    }

    if (!turnstileReady) {
      setErrorMessage(
        turnstileFailedRef.current
          ? 'This form is not available right now. Please try again later.'
          : 'One moment and try again.',
      );
      setStatus('error');

      return;
    }

    setErrorMessage('');
    setStatus('submitting');

    try {
      const turnstileToken = await requestTurnstileToken();
      const response = await fetch('/api/waitlist', {
        body: JSON.stringify({
          email: normalizedEmail,
          turnstileToken,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const errorCode = isWaitlistErrorResponse(payload)
          ? payload.error
          : waitlistErrorCodes.serverError;

        throw new Error(getErrorMessage(errorCode));
      }

      if (!isMountedRef.current) {
        return;
      }

      setEmail('');
      setStatus('success');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : getErrorMessage(waitlistErrorCodes.serverError),
      );
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p
        className={twMerge(
          'text-center text-lg text-white/70 font-sans-serif',
          dark ? 'text-white/60' : 'text-white/70',
          className,
        )}
      >
        Thanks! We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={twMerge('flex items-center justify-center px-4', className)}
      noValidate
    >
      <div className="w-full max-w-[28rem]">
        <div
          className={twMerge(
            'flex h-14 items-center rounded-full border border-ink/10 bg-white/60 backdrop-blur-sm pl-5 pr-1.5',
            dark ? 'bg-white/15' : 'bg-white/60',
          )}
        >
          <input
            aria-label="Email address"
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (status === 'error') {
                setErrorMessage('');
                setStatus('idle');
              }
            }}
            placeholder="you@company.com"
            className={twMerge(
              'w-72 bg-transparent text-base text-ink placeholder:text-ink/40 outline-none font-sans-serif',
              dark ? 'text-white placeholder:text-white/40' : 'text-ink placeholder:text-ink/40',
            )}
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={twMerge(
              'h-10 cursor-pointer rounded-full bg-ink px-5 text-sm font-medium text-white font-sans-serif hover:bg-ink/85 transition-colors shrink-0 disabled:cursor-wait disabled:opacity-70',
              dark ? 'bg-white text-ink hover:bg-white/85' : 'bg-ink text-white',
            )}
          >
            {status === 'submitting' ? 'Submitting...' : 'Join waitlist'}
          </button>
        </div>
        <div
          ref={containerRef}
          aria-hidden="true"
          className="pointer-events-none h-0 overflow-hidden"
        />
        {status === 'error' && (
          <p
            role="alert"
            className={twMerge(
              'mt-3 text-center text-sm font-sans-serif',
              dark ? 'text-white/75' : 'text-ink/75',
            )}
          >
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function clearPendingTokenHandlers(
  rejectTokenRef: React.MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: React.MutableRefObject<((token: string) => void) | null>,
) {
  rejectTokenRef.current = null;
  resolveTokenRef.current = null;
}

function getErrorMessage(errorCode: WaitlistErrorCode): string {
  switch (errorCode) {
    case waitlistErrorCodes.captchaFailed:
    case waitlistErrorCodes.missingToken:
      return 'Could not verify the submission. Please try again.';
    case waitlistErrorCodes.invalidEmail:
      return 'Enter a valid email address.';
    case waitlistErrorCodes.serverError:
    default:
      return 'Something went wrong. Please try again in a moment.';
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SOURCE}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Turnstile.')),
        {
          once: true,
        },
      );
      existingScript.addEventListener('load', () => resolve(), { once: true });

      if (window.turnstile) {
        resolve();
      }

      return;
    }

    const script = document.createElement('script');

    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Turnstile.'));
    script.onload = () => resolve();
    script.src = TURNSTILE_SCRIPT_SOURCE;

    document.head.append(script);
  });

  return turnstileScriptPromise;
}

function rejectPendingToken(
  rejectTokenRef: React.MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: React.MutableRefObject<((token: string) => void) | null>,
  message: string,
) {
  const reject = rejectTokenRef.current;

  clearPendingTokenHandlers(rejectTokenRef, resolveTokenRef);
  reject?.(message);
}

function resolvePendingToken(
  rejectTokenRef: React.MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: React.MutableRefObject<((token: string) => void) | null>,
  token: string,
) {
  const resolve = resolveTokenRef.current;

  clearPendingTokenHandlers(rejectTokenRef, resolveTokenRef);
  resolve?.(token);
}
