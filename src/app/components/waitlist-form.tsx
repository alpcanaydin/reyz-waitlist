'use client';

import type { SubmitEvent } from 'react';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  className?: string;
}

export default function WaitlistForm({ className }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!email) return;
    console.log('Waitlist signup:', email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className={twMerge('text-center text-lg text-ink/70 font-sans-serif', className)}>
        Thanks! We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={twMerge('flex items-center justify-center px-4', className)}
    >
      <div className="flex h-14 items-center rounded-full border border-ink/10 bg-white/60 backdrop-blur-sm pl-5 pr-1.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-72 bg-transparent text-base text-ink placeholder:text-ink/40 outline-none font-sans-serif"
        />
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-full bg-ink px-5 text-sm font-medium text-white font-sans-serif hover:bg-ink/85 transition-colors shrink-0"
        >
          Join waitlist
        </button>
      </div>
    </form>
  );
}
