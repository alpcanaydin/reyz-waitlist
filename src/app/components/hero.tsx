'use client';

import Image from 'next/image';
import { useState } from 'react';

import Background from './background';
import CollaborativeCursors from './collaborative-cursors';
import Header from './header';
import HeroText from './hero-text';
import ReyzDemoWindow from './reyz-demo-window';
import WaitlistForm from './waitlist-form';

export default function Hero() {
  const [typewriterDone, setTypewriterDone] = useState(false);

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
          <div
            className={`transition-all duration-700 ease-out ${typewriterDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            <Image src="/icon.svg" alt="Reyz.ai" width={90} height={90} className="mb-8 mx-auto" />
          </div>
          <HeroText onComplete={() => setTypewriterDone(true)} />
          <div
            className={`transition-all duration-700 ease-out ${typewriterDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            <WaitlistForm className="mt-12" />
            <p className="mt-6 text-center text-lg text-ink/80 font-sans-serif mx-auto text-balance max-w-3xl px-4">
              Reyz turns AI from a tool you prompt into a team you collaborate with assigning roles,
              equipping tools, and working together in shared channels.
            </p>
          </div>
        </div>
      </div>

      {/* Demo window — immediately after description */}
      <div
        className={`mt-8 transition-all duration-700 ease-out ${typewriterDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <ReyzDemoWindow />
      </div>
    </div>
  );
}
