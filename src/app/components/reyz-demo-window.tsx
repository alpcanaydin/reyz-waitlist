'use client';

import { useEffect, useRef, useState } from 'react';

import type { ViewId } from './demo/types';

import DemoChatArea from './demo/demo-chat-area';
import DemoSidebar from './demo/demo-sidebar';

const SYSTEM_FONT =
  'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

export default function ReyzDemoWindow() {
  const [activeView, setActiveView] = useState<ViewId>('developers');
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [developersUnreadCount, setDevelopersUnreadCount] = useState(0);
  const [isClearlyVisible, setIsClearlyVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsClearlyVisible(true);
          observer.disconnect();
        }
      },
      { threshold: [0] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div data-hide-cursors className="relative mx-auto max-w-[1200px] px-4 pb-24">
      <div
        ref={windowRef}
        className="flex overflow-hidden rounded-2xl shadow-[0px_18px_90px_0px_rgb(0_0_0/0.18)] aspect-[3/4] md:aspect-[16/10]"
        style={{ fontFamily: SYSTEM_FONT }}
      >
        <DemoSidebar
          activeView={activeView}
          developersUnreadCount={developersUnreadCount}
          onViewChange={setActiveView}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((current) => (current === null ? false : !current))}
        />
        <DemoChatArea
          activeView={activeView}
          shouldAnimate={isClearlyVisible && !animationPlayed}
          onAnimationComplete={() => setAnimationPlayed(true)}
          onDevelopersUnreadCountChange={setDevelopersUnreadCount}
          animationPlayed={animationPlayed}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
