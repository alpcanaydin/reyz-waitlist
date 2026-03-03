'use client';

import type { CSSProperties } from 'react';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { DeveloperNotification } from './types';

import { USERS } from './demo-data';

interface DemoNotificationStackProps {
  notifications: DeveloperNotification[];
  onOpen: () => void;
  onDismiss: () => void;
}

const SLIVER_HEIGHT = 10;
const NARROW_STEP = 10;
const AMBIENT_SLIVER_OVERLAP = 22;
const SLIVER_CARD_OVERLAP = 12;

export default function DemoNotificationStack({
  notifications,
  onOpen,
  onDismiss,
}: DemoNotificationStackProps) {
  const [topCardHeight, setTopCardHeight] = useState(124);
  const [isDismissing, setIsDismissing] = useState(false);
  const [relativeTime, setRelativeTime] = useState('just now');
  const arrivedAtRef = useRef(0);
  const topCardRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  const visibleNotifications = notifications.slice(-3).reverse();
  const hasMultiple = notifications.length > 1;

  const formatRelative = useCallback((ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 2) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    return `${m}m ago`;
  }, []);

  const topNotificationId = visibleNotifications[0]?.id;
  useEffect(() => {
    arrivedAtRef.current = performance.now();
    const tick = setInterval(() => {
      setRelativeTime(formatRelative(performance.now() - arrivedAtRef.current));
    }, 1000);
    return () => clearInterval(tick);
  }, [topNotificationId, formatRelative]);

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

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDismissing(true);
  }

  function handleDismissAnimationEnd() {
    if (isDismissing) {
      setIsDismissing(false);
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
        <div className="pointer-events-auto absolute -left-0.5 -top-0.5 z-50 translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover/stack:translate-x-0 group-hover/stack:opacity-100 md:-left-1 md:-top-1">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={hasMultiple ? 'Clear all notifications' : 'Dismiss notification'}
            className="group/dismiss flex h-6 items-center rounded-full bg-white/78 px-[5px] shadow-[0_8px_20px_rgba(31,38,135,0.12)] ring-1 ring-white/65 backdrop-blur-md transition-all duration-150 hover:bg-white/88 hover:shadow-[0_10px_24px_rgba(31,38,135,0.16)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <path
                d="M4 4l6 6M10 4l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-slate-500"
              />
            </svg>
            {hasMultiple && (
              <span className="inline-block max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium text-slate-600 opacity-0 transition-all duration-200 ease-out group-hover/dismiss:ml-1 group-hover/dismiss:mr-0.5 group-hover/dismiss:max-w-[80px] group-hover/dismiss:opacity-100">
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
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div
            className="demo-notification-ambient demo-notification-ambient--card absolute inset-x-0 top-0 backdrop-blur-xs backdrop-saturate-125"
            style={{ height: `${topCardHeight}px` }}
          />
          {visibleNotifications.slice(1).map((notification, index) => (
            <div
              key={`ambient-${notification.id}`}
              className="demo-notification-ambient demo-notification-ambient--bridge absolute backdrop-blur-xs backdrop-saturate-125 transition-[top,left,right] duration-200 ease-out"
              style={getAmbientBridgeStyle(index + 1, topCardHeight, visibleNotifications.length)}
            />
          ))}
        </div>

        {visibleNotifications.map((notification, index) => {
          const user = USERS[notification.userId];
          const isTopCard = index === 0;

          if (!isTopCard) {
            return (
              <div
                key={notification.id}
                className="demo-notification-sliver absolute transition-[top,left,right] duration-200 ease-out"
                style={getSliverStyle(
                  index,
                  topCardHeight,
                  visibleNotifications.length,
                  SLIVER_CARD_OVERLAP,
                )}
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
                      <span className="text-sm font-semibold leading-none text-slate-700">
                        #developers
                      </span>
                      <span className="ml-auto shrink-0 text-xs font-medium text-slate-500">
                        {relativeTime}
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

function getAmbientBridgeStyle(
  index: number,
  topCardHeight: number,
  visibleCount: number,
): CSSProperties {
  const insetX = index * NARROW_STEP;

  return {
    top: `${topCardHeight - AMBIENT_SLIVER_OVERLAP + (index - 1) * SLIVER_HEIGHT}px`,
    left: `${insetX}px`,
    right: `${insetX}px`,
    height: `${AMBIENT_SLIVER_OVERLAP + 2}px`,
    zIndex: visibleCount - index,
  };
}

function getSliverStyle(
  index: number,
  topCardHeight: number,
  visibleCount: number,
  overlap = 0,
): CSSProperties {
  const insetX = index * NARROW_STEP;

  return {
    top: `${topCardHeight - overlap + (index - 1) * SLIVER_HEIGHT}px`,
    left: `${insetX}px`,
    right: `${insetX}px`,
    height: `${SLIVER_HEIGHT + overlap}px`,
    zIndex: visibleCount - index,
  };
}
