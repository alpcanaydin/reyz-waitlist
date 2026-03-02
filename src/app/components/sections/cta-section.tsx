'use client';

import { useEffect, useRef, useState } from 'react';

import WaitlistForm from '../waitlist-form';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-20 md:py-24 px-4 bg-ink">
      <div
        className={`mx-auto max-w-3xl text-center transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <h2 className="text-4xl font-sans-serif tracking-tight text-ink md:text-5xl lg:text-6xl">
          Your AI team is ready.
        </h2>
        <p className="mt-3 text-lg text-white/60 font-sans-serif">
          Join the waitlist for early access to Reyz.
        </p>
        <WaitlistForm dark className="mt-10" />
      </div>
    </section>
  );
}
