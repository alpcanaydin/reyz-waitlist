import Image from 'next/image';

import Background from './background';

export default function Hero() {
  return (
    <div className="absolute inset-0">
      <Background />
      <div className="absolute inset-0 pointer-events-none">
        <div className="mx-auto container max-w-7xl px-4 pt-6 flex items-center justify-between pointer-events-auto">
          <Image src="/logo.svg" alt="Reyz.ai" width={80} height={32} />
          <button className="bg-ink text-white text-sm font-medium tracking-wide px-6 py-3 rounded-full">
            Join the waitlist
          </button>
        </div>
        <div className="flex items-center justify-center absolute inset-0">
          <h1 className="max-w-6xl px-4 text-center font-sans-serif tracking-tight leading-[1.1] text-7xl text-ink text-balance">
            <span className="text-[#912E9E]">@channel</span> your AI team just joined your
            workspace!
          </h1>
        </div>
      </div>
    </div>
  );
}
