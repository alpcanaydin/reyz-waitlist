'use client';

import type { CSSProperties } from 'react';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { DeveloperNotification } from './types';

import { USERS } from './demo-data';

interface DemoNotificationStackProps {
  notifications: DeveloperNotification[];
  onOpen: () => void;
  onDismiss: () => void;
}

const SLIVER_HEIGHT = 14;
const NARROW_STEP = 10;

export default function DemoNotificationStack({
  notifications,
  onOpen,
  onDismiss,
}: DemoNotificationStackProps) {
  const [topCardHeight, setTopCardHeight] = useState(124);
  const [isDismissing, setIsDismissing] = useState(false);
  const topCardRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  const visibleNotifications = notifications.slice(-3).reverse();
  const hiddenCount = Math.max(0, notifications.length - visibleNotifications.length);
  const hasMultiple = notifications.length > 1;

  const behindCount = Math.max(0, visibleNotifications.length - 1);
  const stackHeight = topCardHeight + behindCount * SLIVER_HEIGHT;

  useEffect(() => {
    const topCardElement = topCardRef.current;
    if (!topCardElement) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextHeight = Math.ceil(entry.contentRect.height);
      setTopCardHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    });

    observer.observe(topCardElement);
    return () => observer.disconnect();
  }, [notifications.length]);

  useEffect(() => {
    if (notifications.length === 0) {
      setIsDismissing(false);
    }
  }, [notifications.length]);

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDismissing(true);
  }

  function handleDismissAnimationEnd() {
    if (isDismissing) {
      onDismiss();
    }
  }

  if (!portalTarget || notifications.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="group/stack pointer-events-none fixed inset-x-3 top-3 z-40 md:left-auto md:right-5 md:top-5 md:w-[380px]"
    >
      {/* Dismiss / Clear All button */}
      {!isDismissing && (
        <div className="pointer-events-auto absolute -left-1 -top-1 z-50 translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover/stack:translate-x-0 group-hover/stack:opacity-100 md:-left-2 md:-top-2">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={hasMultiple ? 'Clear all notifications' : 'Dismiss notification'}
            className="group/dismiss flex h-7 items-center rounded-full bg-white/90 px-2 shadow-lg ring-1 ring-black/[0.06] backdrop-blur-sm transition-all duration-150 hover:bg-white hover:shadow-xl"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <path
                d="M4 4l6 6M10 4l-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="text-slate-500"
              />
            </svg>
            {hasMultiple && (
              <span className="inline-block max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold text-slate-600 opacity-0 transition-all duration-200 ease-out group-hover/dismiss:ml-1.5 group-hover/dismiss:mr-0.5 group-hover/dismiss:max-w-[80px] group-hover/dismiss:opacity-100">
                Clear All
              </span>
            )}
          </button>
        </div>
      )}

      <div
        className={`demo-notification-stack relative${isDismissing ? ' is-dismissing' : ''}`}
        style={{ height: `${stackHeight}px` }}
        onAnimationEnd={handleDismissAnimationEnd}
      >
        {visibleNotifications.map((notification, index) => {
          const user = USERS[notification.userId];
          const isTopCard = index === 0;

          if (!isTopCard) {
            const insetX = index * NARROW_STEP;
            const sliverStyle: CSSProperties = {
              top: `${topCardHeight + (index - 1) * SLIVER_HEIGHT}px`,
              left: `${insetX}px`,
              right: `${insetX}px`,
              height: `${SLIVER_HEIGHT}px`,
              zIndex: visibleNotifications.length - index,
            };

            return (
              <div
                key={notification.id}
                className="absolute rounded-b-3xl border border-t-0 border-white/40 bg-white/90 shadow-sm backdrop-blur-xl transition-[top,left,right] duration-200 ease-out"
                style={sliverStyle}
              />
            );
          }

          return (
            <div
              key={notification.id}
              ref={topCardRef}
              className="absolute inset-x-0 top-0"
              style={{ zIndex: visibleNotifications.length }}
            >
              <button
                type="button"
                onClick={onOpen}
                aria-label={`Open developers and jump to the latest message from ${user?.name ?? notification.userId}`}
                className="demo-liquid-notification pointer-events-auto block w-full text-left focus-visible:outline-none"
              >
                {hiddenCount > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/55 px-2 py-0.5 text-xs font-semibold tracking-tight text-slate-700 shadow-[0_6px_18px_rgba(148,163,184,0.14)]">
                    +{hiddenCount} more
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <Avatar notification={notification} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold tracking-tight text-slate-900">
                        {user?.name ?? notification.userId}
                        {user?.isAgent && (
                          <span className="ml-1 text-sm leading-none">{'\u{1F916}'}</span>
                        )}
                      </span>
                      <span className="rounded-full bg-white/45 px-2 py-0.5 text-sm font-semibold leading-none text-slate-500">
                        # developers
                      </span>
                      <span className="ml-auto shrink-0 text-xs font-medium text-slate-500/90">
                        {notification.timestamp}
                      </span>
                    </div>

                    <p
                      className="text-sm leading-5 text-slate-700"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notification.text}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    portalTarget,
  );
}

function Avatar({ notification }: { notification: DeveloperNotification }) {
  const user = USERS[notification.userId];

  if (user?.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={40}
        height={40}
        className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/55"
      />
    );
  }

  const label = user?.name ?? notification.userId;

  return (
    <div
      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-1 ring-white/55"
      style={{ backgroundColor: user?.avatarColor ?? '#94A3B8' }}
    >
      {label[0]}
    </div>
  );
}
