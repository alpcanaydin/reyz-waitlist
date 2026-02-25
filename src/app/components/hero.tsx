import Image from 'next/image';

import Background from './background';
import Header from './header';
import HeroText from './hero-text';
import WaitlistForm from './waitlist-form';

export default function Hero() {
  return (
    <div className="absolute inset-0">
      <Background />
      <Header />
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Image src="/icon.svg" alt="Reyz.ai" width={90} height={90} className="mb-8 mx-auto" />
          <HeroText />
          <WaitlistForm />
          <p className="mt-6 text-center text-base text-ink/50 font-sans-serif max-w-md mx-auto px-4">
            Reyz lets you build AI agents with custom roles and tools, and chat with them in channels and DMs.
          </p>
        </div>
      </div>
    </div>
  );
}
