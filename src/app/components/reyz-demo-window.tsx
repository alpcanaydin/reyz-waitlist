'use client';

import { useEffect, useRef, useState } from 'react';

import type { AnimatedMessage, DeveloperNotification, ViewId } from './demo/types';

import DemoChatArea from './demo/demo-chat-area';
import DemoNotificationStack from './demo/demo-notification-stack';
import DemoSidebar from './demo/demo-sidebar';

const SYSTEM_FONT =
  'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

export default function ReyzDemoWindow() {
  const [activeView, setActiveView] = useState<ViewId>('developers');
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [developerNotifications, setDeveloperNotifications] = useState<DeveloperNotification[]>([]);
  const [developersUnreadCount, setDevelopersUnreadCount] = useState(0);
  const [hasBeenClearlyVisibleOnce, setHasBeenClearlyVisibleOnce] = useState(false);
  const [isWindowInViewport, setIsWindowInViewport] = useState(false);
  const [scrollToBottomRequestId, setScrollToBottomRequestId] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);

  const isWindowInViewportRef = useRef(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInViewport = entry.isIntersecting && entry.intersectionRatio >= 0.15;

        isWindowInViewportRef.current = isInViewport;
        setIsWindowInViewport(isInViewport);

        if (isInViewport) {
          setHasBeenClearlyVisibleOnce(true);
        }
      },
      { threshold: [0, 0.15, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleViewChange(nextView: ViewId) {
    if (nextView === 'developers') {
      setDeveloperNotifications([]);
    }

    setActiveView(nextView);
  }

  function handleDevelopersBackgroundMessage(message: AnimatedMessage) {
    if (isWindowInViewport || isWindowInViewportRef.current) return;

    setDeveloperNotifications((notifications) => [
      ...notifications,
      {
        id: message.id,
        messageId: message.id,
        userId: message.userId,
        text: message.text,
        timestamp: message.timestamp,
      },
    ]);
  }

  function handleNotificationOpen() {
    const scrollBlock: ScrollLogicalPosition = window.innerWidth < 768 ? 'start' : 'center';

    setDeveloperNotifications([]);
    setActiveView('developers');
    setScrollToBottomRequestId((requestId) => requestId + 1);
    windowRef.current?.scrollIntoView({ behavior: 'smooth', block: scrollBlock });
  }

  return (
    <div data-hide-cursors className="relative mx-auto max-w-[1200px] px-4 pb-24">
      <DemoNotificationStack
        notifications={developerNotifications}
        onOpen={handleNotificationOpen}
        onDismiss={() => setDeveloperNotifications([])}
      />
      <div
        ref={windowRef}
        className="flex overflow-hidden rounded-2xl shadow-[0px_18px_90px_0px_rgb(0_0_0/0.18)] aspect-[3/4] md:aspect-[16/10]"
        style={{ fontFamily: SYSTEM_FONT }}
      >
        <DemoSidebar
          activeView={activeView}
          developersUnreadCount={developersUnreadCount}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((current) => (current === null ? false : !current))}
        />
        <DemoChatArea
          activeView={activeView}
          shouldAnimate={hasBeenClearlyVisibleOnce && !animationPlayed}
          onAnimationComplete={() => setAnimationPlayed(true)}
          onDevelopersBackgroundMessage={handleDevelopersBackgroundMessage}
          onDevelopersUnreadCountChange={setDevelopersUnreadCount}
          animationPlayed={animationPlayed}
          sidebarOpen={sidebarOpen}
          scrollToBottomRequestId={scrollToBottomRequestId}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
