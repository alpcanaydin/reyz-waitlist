'use client';

import { ArrowUp02Icon, SidebarRightIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState } from 'react';

import type { AnimatedMessage, ViewId } from './types';

import { CONVERSATIONS, USERS } from './demo-data';
import DemoMessage from './demo-message';
import DemoTypingIndicator from './demo-typing-indicator';

const DEVELOPERS_ANIMATED_MESSAGES = CONVERSATIONS.developers.animatedMessages ?? [];
const FINAL_DEVELOPERS_SELF_MESSAGE_INDEX = DEVELOPERS_ANIMATED_MESSAGES.reduce<number>(
  (lastIndex, message, index) => (message.userId === 'you' ? index : lastIndex),
  -1,
);

interface DemoChatAreaProps {
  activeView: ViewId;
  shouldAnimate: boolean;
  onAnimationComplete: () => void;
  onDevelopersUnreadCountChange: (count: number) => void;
  animationPlayed: boolean;
  sidebarOpen: boolean | null;
  onOpenSidebar: () => void;
}

export default function DemoChatArea({
  activeView,
  shouldAnimate,
  onAnimationComplete,
  onDevelopersUnreadCountChange,
  animationPlayed,
  sidebarOpen,
  onOpenSidebar,
}: DemoChatAreaProps) {
  const [displayedView, setDisplayedView] = useState<ViewId>(activeView);
  const [fading, setFading] = useState(false);
  const [visibleAnimatedCount, setVisibleAnimatedCount] = useState(0);
  const [typingUserId, setTypingUserId] = useState<null | string>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [inputDraft, setInputDraft] = useState('');
  const [inputInView, setInputInView] = useState(false);
  const [isInputTyping, setIsInputTyping] = useState(false);
  const [startRunId, setStartRunId] = useState(0);
  const [developersUnreadCount, setDevelopersUnreadCount] = useState(0);
  const [deferredFinalMessageIndex, setDeferredFinalMessageIndex] = useState<null | number>(null);

  const hasStartedRef = useRef(false);
  const activeViewRef = useRef(activeView);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const currentAnimatedIndexRef = useRef(0);
  const deferredFinalMessageRunnerRef = useRef<(() => void) | null>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // View switching with fade
  useEffect(() => {
    if (activeView === displayedView) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Demo view fade is intentionally driven by view changes.
    setFading(true);
    const id = setTimeout(() => {
      setDisplayedView(activeView);
      setFading(false);
    }, 150);
    return () => clearTimeout(id);
  }, [activeView, displayedView]);

  // Gate simulation start until the composer is actually in viewport.
  useEffect(() => {
    const inputEl = inputBarRef.current;
    if (!inputEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInputInView(entry.isIntersecting);
      },
      { threshold: [0] },
    );

    observer.observe(inputEl);
    return () => observer.disconnect();
  }, []);

  // One-time start gate: requires developers view + window visible + input visible.
  useEffect(() => {
    if (displayedView !== 'developers') return;
    if (!shouldAnimate || !inputInView || animationPlayed || hasStartedRef.current) return;

    hasStartedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The one-time animation run starts from this gate.
    setStartRunId((runId) => runId + 1);
  }, [displayedView, shouldAnimate, inputInView, animationPlayed]);

  useEffect(() => {
    activeViewRef.current = activeView;
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [activeView, onAnimationComplete]);

  useEffect(() => {
    onDevelopersUnreadCountChange(developersUnreadCount);
  }, [developersUnreadCount, onDevelopersUnreadCountChange]);

  useEffect(() => {
    if (activeView !== 'developers') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Unread should clear immediately when developers is opened.
    setDevelopersUnreadCount((count) => (count === 0 ? count : 0));
  }, [activeView]);

  useEffect(() => {
    if (deferredFinalMessageIndex === null || displayedView !== 'developers') return;

    const resumeDeferredFinalMessage = deferredFinalMessageRunnerRef.current;
    if (!resumeDeferredFinalMessage) return;

    deferredFinalMessageRunnerRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Resuming consumes the deferred final message in the same transition.
    setDeferredFinalMessageIndex(null);
    resumeDeferredFinalMessage();
  }, [deferredFinalMessageIndex, displayedView]);

  // Dedicated simulation runner. It does not depend on viewport gates after start.
  useEffect(() => {
    if (startRunId === 0) return;

    if (!DEVELOPERS_ANIMATED_MESSAGES.length) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Each run resets the demo simulation state before timers start.
    setVisibleAnimatedCount(0);
    setShowReactions(false);
    setTypingUserId(null);
    setInputDraft('');
    setIsInputTyping(false);
    setDevelopersUnreadCount(0);
    setDeferredFinalMessageIndex(null);

    currentAnimatedIndexRef.current = 0;
    deferredFinalMessageRunnerRef.current = null;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const scaleDelay = (delay: number, minimum = 0) => Math.max(minimum, Math.round(delay * 0.84));
    const schedule = (fn: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        fn();
      }, delay);
      timers.add(timer);
      return timer;
    };

    const revealMessage = (messageIndex: number, countAsUnread: boolean) => {
      currentAnimatedIndexRef.current = messageIndex + 1;
      setVisibleAnimatedCount(currentAnimatedIndexRef.current);

      if (countAsUnread) {
        setDevelopersUnreadCount((count) => count + 1);
      }
    };

    const finishSimulation = () => {
      setTypingUserId(null);
      schedule(
        () => {
          setShowReactions(true);
          onAnimationCompleteRef.current();
        },
        scaleDelay(500, 260),
      );
    };

    const composeOwnMessage = (messageIndex: number, message: AnimatedMessage) => {
      let charIndex = 0;
      const perCharDelay = Math.max(
        14,
        Math.floor(scaleDelay(message.typingDuration, 240) / Math.max(message.text.length, 1)),
      );

      setTypingUserId(null);
      setIsInputTyping(true);
      setInputDraft('');

      const typeNextCharacter = () => {
        if (charIndex >= message.text.length) {
          schedule(
            () => {
              setIsInputTyping(false);
              setInputDraft('');
              revealMessage(messageIndex, false);
              schedule(showNext, scaleDelay(message.pauseAfter, 220));
            },
            scaleDelay(220, 140),
          );
          return;
        }

        charIndex += 1;
        setInputDraft(message.text.slice(0, charIndex));
        schedule(
          typeNextCharacter,
          message.text[charIndex - 1] === ' ' ? Math.max(14, perCharDelay - 6) : perCharDelay,
        );
      };

      schedule(typeNextCharacter, Math.min(scaleDelay(80, 30), perCharDelay));
    };

    function showNext() {
      if (currentAnimatedIndexRef.current >= DEVELOPERS_ANIMATED_MESSAGES.length) {
        finishSimulation();
        return;
      }

      const messageIndex = currentAnimatedIndexRef.current;
      const message = DEVELOPERS_ANIMATED_MESSAGES[messageIndex];
      const isFinalSelfMessage =
        messageIndex === FINAL_DEVELOPERS_SELF_MESSAGE_INDEX && message.userId === 'you';

      if (message.userId === 'you') {
        if (isFinalSelfMessage && activeViewRef.current !== 'developers') {
          deferredFinalMessageRunnerRef.current = () => composeOwnMessage(messageIndex, message);
          setDeferredFinalMessageIndex(messageIndex);
          return;
        }

        composeOwnMessage(messageIndex, message);
        return;
      }

      // Phase 1: Show typing indicator
      setTypingUserId(message.userId);
      schedule(
        () => {
          // Phase 2: Reveal message
          setTypingUserId(null);
          revealMessage(messageIndex, activeViewRef.current !== 'developers');

          // Phase 3: Pause then next
          schedule(showNext, scaleDelay(message.pauseAfter, 220));
        },
        scaleDelay(message.typingDuration, 260),
      );
    }

    schedule(showNext, scaleDelay(160, 90));

    return () => {
      deferredFinalMessageRunnerRef.current = null;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [startRunId]);

  // Reset scroll on view switch
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [displayedView]);

  // Keep viewport following incoming simulation content.
  useEffect(() => {
    if (displayedView !== 'developers') return;
    if (startRunId === 0 && !animationPlayed) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    // Scroll only inside the chat panel; avoid moving the page viewport.
    container.scrollTop = container.scrollHeight;
  }, [
    displayedView,
    visibleAnimatedCount,
    typingUserId,
    showReactions,
    deferredFinalMessageIndex,
    animationPlayed,
    startRunId,
  ]);

  const conversation = CONVERSATIONS[displayedView];
  const isDevelopers = displayedView === 'developers';
  const animated = conversation.animatedMessages;

  // Determine which animated messages to show
  const animatedToShow =
    isDevelopers && animated
      ? animationPlayed
        ? animated // Show all if animation already played
        : animated.slice(0, visibleAnimatedCount)
      : [];

  const shouldShowReactions = animationPlayed || showReactions;
  const showLiveDevelopersState = isDevelopers;
  const typingUser = showLiveDevelopersState && typingUserId ? USERS[typingUserId] : null;

  // Input placeholder text
  const inputPlaceholder = displayedView.startsWith('dm-')
    ? `Message ${conversation.headerTitle}`
    : `Message ${conversation.headerTitle}`;
  const showInputDraft = showLiveDevelopersState && isInputTyping;
  const inputText = showInputDraft ? inputDraft : inputPlaceholder;
  const inputTextClass = showInputDraft ? 'text-sm text-gray-700' : 'text-sm text-gray-400';
  const showOpenSidebarButton = sidebarOpen !== true;
  const openSidebarButtonClass = sidebarOpen === null ? 'md:hidden' : '';

  return (
    <div ref={chatWindowRef} className="flex flex-1 flex-col bg-white">
      {/* Channel header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200/50 px-5 py-3">
        {showOpenSidebarButton && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-700 ${openSidebarButtonClass}`}
            aria-label="Open sidebar"
          >
            <HugeiconsIcon icon={SidebarRightIcon} size={14} strokeWidth={1.5} />
          </button>
        )}
        <h3 className="text-base font-semibold text-gray-900">{conversation.headerTitle}</h3>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto py-3 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Static messages */}
        {conversation.staticMessages.map((msg) => (
          <DemoMessage key={msg.id} message={msg} user={USERS[msg.userId]} />
        ))}

        {/* Animated messages (developers only) */}
        {animatedToShow.map((msg, i) => (
          <DemoMessage
            key={msg.id}
            message={msg}
            user={USERS[msg.userId]}
            animated={!animationPlayed && i === visibleAnimatedCount - 1}
            countUpReactions={showReactions}
            showReactions={shouldShowReactions}
          />
        ))}

        {/* Typing indicator */}
        {typingUser && <DemoTypingIndicator user={typingUser} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar (decorative) */}
      <div ref={inputBarRef} className="shrink-0 px-4 pb-3">
        <div className="flex flex-col rounded-xl border border-gray-200/50 bg-white/60 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-400">
            {/* Bold icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
            {/* Italic icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
            {/* Paperclip icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {/* Smiley icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <span className={`flex min-h-[20px] flex-1 items-center leading-5 ${inputTextClass}`}>
              {inputText}
              {showInputDraft && (
                <span className="ml-1 inline-block h-3.5 w-px animate-pulse bg-gray-500 align-middle" />
              )}
            </span>
            <button
              type="button"
              aria-label="Send message"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white/90"
            >
              <HugeiconsIcon icon={ArrowUp02Icon} size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
