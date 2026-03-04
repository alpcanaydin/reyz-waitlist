'use client';

import { useEffect, useState } from 'react';

import Footer from './components/footer';
import Hero from './components/hero';
import AnatomySection from './components/sections/anatomy-section';
import CTASection from './components/sections/cta-section';
import IntroSection from './components/sections/intro-section';
import MarketplaceSection from './components/sections/marketplace-section';
import SeatSection from './components/sections/seat-section';

export default function Home() {
  const [ready, setReady] = useState(false);

  // Keep the viewport pinned to the hero until the typewriter completes.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRestoration = window.history.scrollRestoration;

    if (!ready) {
      window.history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      root.style.overflow = '';
      body.style.overflow = '';
    }

    return () => {
      window.history.scrollRestoration = previousRestoration;
      root.style.overflow = '';
      body.style.overflow = '';
    };
  }, [ready]);

  return (
    <>
      <Hero onReady={() => setReady(true)} />
      {ready && (
        <>
          {/* Gradient bridge: WebGL background fades to white */}
          <div className="relative h-24 bg-linear-to-b from-transparent to-white pointer-events-none" />
          <div className="animate-section-reveal">
            <IntroSection />
            <SeatSection />
            <AnatomySection />
            <MarketplaceSection />
            <CTASection />
            <Footer />
          </div>
        </>
      )}
    </>
  );
}
