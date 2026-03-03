'use client';

import type { FormEvent, MutableRefObject } from 'react';

import { useEffect, useId, useRef, useState } from 'react';
import Confetti from 'react-confetti-boom';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';

import {
  isValidWaitlistEmail,
  isWaitlistErrorResponse,
  isWaitlistSuccessResponse,
  normalizeWaitlistEmail,
  type WaitlistErrorCode,
  waitlistErrorCodes,
  type WaitlistSuccessResponse,
} from '@/src/lib/waitlist';

interface Props {
  className?: string;
  dark?: boolean;
}

type SuccessPayload = Pick<WaitlistSuccessResponse, 'email' | 'ticketCode'>;
type SuccessPhase = 'overlay' | 'settled' | null;
type WaitlistStatus = 'error' | 'idle' | 'submitting';

const SUCCESS_OVERLAY_EXIT_DURATION_MS = 420;
const TURNSTILE_SCRIPT_SOURCE =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const WAITLIST_CONFETTI_COLORS = ['#f8dcc1', '#f5ab93', '#f9f3e8', '#d7c49e', '#fbe7a8'];

let turnstileScriptPromise: null | Promise<void> = null;

interface WaitlistSettledBadgeProps {
  className?: string;
  dark?: boolean;
  email: string;
  ticketCode: string;
}

interface WaitlistSuccessOverlayProps {
  email: string;
  isExiting: boolean;
  onClose: () => void;
  prefersReducedMotion: boolean;
  ticketCode: string;
}

export default function WaitlistForm({ className, dark }: Props) {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [overlayIsExiting, setOverlayIsExiting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const [successPayload, setSuccessPayload] = useState<null | SuccessPayload>(null);
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<null | number>(null);
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
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
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
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleMotionPreferenceChange();
    mediaQuery.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    if (successPhase !== 'overlay') {
      return;
    }

    setOverlayIsExiting(false);
  }, [successPhase]);

  useEffect(() => {
    if (successPhase !== 'overlay') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [successPhase]);

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

      if (!isWaitlistSuccessResponse(payload)) {
        throw new Error(getErrorMessage(waitlistErrorCodes.serverError));
      }

      if (!isMountedRef.current) {
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      setEmail('');
      setOverlayIsExiting(false);
      setStatus('idle');
      setSuccessPayload({
        email: payload.email,
        ticketCode: payload.ticketCode,
      });
      setSuccessPhase('overlay');
      setTurnstileReady(false);
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

  function handleOverlayClose() {
    if (overlayIsExiting) {
      return;
    }

    setOverlayIsExiting(true);
    closeTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      closeTimerRef.current = null;
      setOverlayIsExiting(false);
      setSuccessPhase('settled');
    }, SUCCESS_OVERLAY_EXIT_DURATION_MS);
  }

  if (successPayload && successPhase === 'settled') {
    return (
      <WaitlistSettledBadge
        className={className}
        dark={dark}
        email={successPayload.email}
        ticketCode={successPayload.ticketCode}
      />
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={twMerge('flex items-center justify-center px-4', className)}
        noValidate
      >
        <div className="w-full max-w-md">
          <div
            className={twMerge(
              'flex h-14 items-center rounded-full border border-ink/10 bg-white/60 pl-5 pr-1.5 backdrop-blur-sm',
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
                'w-72 bg-transparent font-sans-serif text-base text-ink outline-none placeholder:text-ink/40',
                dark ? 'text-white placeholder:text-white/40' : 'text-ink placeholder:text-ink/40',
              )}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className={twMerge(
                'h-10 shrink-0 cursor-pointer rounded-full bg-ink px-5 font-sans-serif text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:cursor-wait disabled:opacity-70',
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
                'mt-3 text-center font-sans-serif text-sm',
                dark ? 'text-white/75' : 'text-ink/75',
              )}
            >
              {errorMessage}
            </p>
          )}
        </div>
      </form>
      {successPayload && successPhase === 'overlay' && (
        <WaitlistSuccessOverlay
          email={successPayload.email}
          isExiting={overlayIsExiting}
          onClose={handleOverlayClose}
          prefersReducedMotion={prefersReducedMotion}
          ticketCode={successPayload.ticketCode}
        />
      )}
    </>
  );
}

function clearPendingTokenHandlers(
  rejectTokenRef: MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: MutableRefObject<((token: string) => void) | null>,
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
  rejectTokenRef: MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: MutableRefObject<((token: string) => void) | null>,
  message: string,
) {
  rejectTokenRef.current?.(message);
  clearPendingTokenHandlers(rejectTokenRef, resolveTokenRef);
}

function resolvePendingToken(
  rejectTokenRef: MutableRefObject<((message: string) => void) | null>,
  resolveTokenRef: MutableRefObject<((token: string) => void) | null>,
  token: string,
) {
  resolveTokenRef.current?.(token);
  clearPendingTokenHandlers(rejectTokenRef, resolveTokenRef);
}

function WaitlistSettledBadge({ className, dark, email, ticketCode }: WaitlistSettledBadgeProps) {
  return (
    <div className={twMerge('px-4', className)}>
      <div
        className={twMerge(
          'waitlist-settled-badge mx-auto w-full max-w-md rounded-[30px] border px-5 py-4 shadow-[0_24px_70px_rgba(18,19,23,0.08)] backdrop-blur-xl',
          dark
            ? 'border-white/14 bg-white/10 text-white'
            : 'border-ink/10 bg-white/82 text-ink shadow-[0_24px_70px_rgba(18,19,23,0.1)]',
        )}
        role="status"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={twMerge(
                'text-sm font-medium tracking-[-0.02em]',
                dark ? 'text-white/92' : 'text-ink/92',
              )}
            >
              You&apos;re on the list
            </p>
            <p
              className={twMerge(
                'mt-1 text-sm leading-6 break-all',
                dark ? 'text-white/62' : 'text-ink/60',
              )}
            >
              {email}
            </p>
          </div>
          <span
            className={twMerge(
              'rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em]',
              dark
                ? 'border-white/14 bg-white/8 text-white/74'
                : 'border-ink/10 bg-ink/5 text-ink/70',
            )}
          >
            Confirmed
          </span>
        </div>
        <div
          className={twMerge(
            'mt-4 rounded-[22px] border px-4 py-3',
            dark ? 'border-white/12 bg-black/14' : 'border-ink/10 bg-ink/[0.04]',
          )}
        >
          <p
            className={twMerge(
              'text-[0.72rem] font-semibold uppercase tracking-[0.24em]',
              dark ? 'text-white/45' : 'text-ink/45',
            )}
          >
            Ticket code
          </p>
          <p
            className={twMerge(
              'mt-2 font-sans text-xl tracking-[-0.05em]',
              dark ? 'text-white/90' : 'text-ink/90',
            )}
          >
            {ticketCode}
          </p>
        </div>
      </div>
    </div>
  );
}

function WaitlistSuccessOverlay({
  email,
  isExiting,
  onClose,
  prefersReducedMotion,
  ticketCode,
}: WaitlistSuccessOverlayProps) {
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={headingId}
      aria-live="polite"
      className={twMerge(
        'waitlist-success-overlay fixed inset-0 z-[120] flex cursor-default items-center justify-center overflow-hidden px-6 py-10 text-white',
        isExiting && 'waitlist-success-overlay--exiting',
      )}
      role="status"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="waitlist-success-orb waitlist-success-orb--one" />
        <div className="waitlist-success-orb waitlist-success-orb--two" />
        <div className="waitlist-success-grid" />
        {!prefersReducedMotion && (
          <Confetti
            className="waitlist-success-confetti"
            colors={WAITLIST_CONFETTI_COLORS}
            fadeOutHeight={0.7}
            mode="fall"
            particleCount={42}
            shapeSize={10}
            style={{ opacity: 0.82 }}
          />
        )}
      </div>
      <button
        type="button"
        aria-label="Close confirmation"
        className="waitlist-success-close-button absolute top-5 right-5 z-20 inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white/84 transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 sm:top-7 sm:right-7"
        disabled={isExiting}
        onClick={onClose}
      >
        Close
      </button>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <div className="waitlist-success-copy max-w-2xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.35em] text-white/58">
            Waitlist confirmed
          </p>
          <h2
            id={headingId}
            className="mt-4 font-sans text-5xl leading-none tracking-[-0.05em] text-white sm:text-6xl md:text-7xl"
          >
            RSVP received
          </h2>
          <p id={descriptionId} className="mt-4 text-lg text-white/68 sm:text-xl">
            Your seat request is on file.
          </p>
          <p className="mt-3 text-sm text-white/46">Close this screen when you&apos;re ready.</p>
        </div>
        <article className="waitlist-ticket waitlist-success-ticket-shell w-full max-w-4xl text-left text-ink">
          <div className="relative z-10 p-5 sm:p-6">
            <div className="waitlist-ticket__meta-row">
              <span className="waitlist-ticket__stub">Admit one</span>
              <span className="waitlist-ticket__series">Series 01</span>
            </div>

            <div className="waitlist-ticket__header grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="waitlist-success-field waitlist-success-field--delay-1">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-black/45">
                  Access
                </p>
                <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-black/88">
                  Early access waitlist
                </p>
              </div>
              <div className="waitlist-success-field waitlist-success-field--delay-2 sm:text-right">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-black/45">
                  Status
                </p>
                <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-black/88">
                  Received
                </p>
              </div>
            </div>

            <div aria-hidden="true" className="waitlist-ticket__perforation" />

            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
              <div className="waitlist-success-field waitlist-success-field--delay-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-black/45">
                  Ticket code
                </p>
                <p className="mt-2.5 font-sans text-[2rem] leading-none tracking-[-0.06em] text-black/92 sm:text-[2.45rem]">
                  {ticketCode}
                </p>
                <p className="mt-3 max-w-md text-sm leading-6 text-black/55 sm:text-[0.96rem]">
                  Keep this pass handy. We&apos;ll use it as the signature for launch updates and
                  early access comms.
                </p>
              </div>

              <div className="waitlist-success-field waitlist-success-field--delay-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-black/45">
                  Guest
                </p>
                <p className="mt-2.5 text-base font-medium tracking-[-0.03em] text-black/82 break-all sm:text-lg">
                  {email}
                </p>
                <div className="waitlist-ticket__mini-panel mt-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/45">
                    Issued
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    Just now for Reyz waitlist access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>,
    document.body,
  );
}
