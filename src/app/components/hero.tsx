import Image from 'next/image';

import Background from './background';
import Header from './header';
import HeroText from './hero-text';

export default function Hero() {
  return (
    <div className="absolute inset-0">
      <Background />
      <Header />
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Image src="/icon.svg" alt="Reyz.ai" width={90} height={90} className="mb-8 mx-auto" />
          <HeroText />
        </div>
      </div>
    </div>
  );
}
