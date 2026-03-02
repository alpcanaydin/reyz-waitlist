'use client';

import Image from 'next/image';
import { useState } from 'react';

import Background from './background';
import CollaborativeCursors from './collaborative-cursors';
import Header from './header';
import HeroText from './hero-text';
import ReyzDemoWindow from './reyz-demo-window';
import WaitlistForm from './waitlist-form';

interface HeroProps {
  onReady?: () => void;
}

export default function Hero({ onReady }: HeroProps) {
  const [typewriterDone, setTypewriterDone] = useState(false);

  function handleTypewriterDone() {
    setTypewriterDone(true);
    onReady?.();
  }

  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        <Background />
      </div>
      <CollaborativeCursors enabled={typewriterDone} />
      <Header />
      {/* Hero text — centered with padding */}
      <div className="relative flex flex-col items-center pt-28 pb-8 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-8 flex h-[90px] items-end justify-center">
            <div
              className={`transition-all duration-700 ease-out ${typewriterDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <Image src="/icon.svg" alt="Reyz.ai" width={90} height={90} className="mx-auto" />
            </div>
          </div>
          <HeroText onComplete={handleTypewriterDone} />
          {typewriterDone && (
            <div className="animate-section-reveal">
              <WaitlistForm className="mt-12" />
              <p className="mt-6 text-center text-lg text-ink/80 font-sans-serif mx-auto text-balance max-w-3xl px-4">
                Reyz turns AI from a tool you prompt into a team you collaborate with assigning
                roles, equipping tools, and working together in shared channels.
              </p>
            </div>
          )}
        </div>
      </div>

      {typewriterDone && (
        <div className="mt-8 animate-section-reveal">
          <ReyzDemoWindow />
        </div>
      )}
    </div>
  );
}
