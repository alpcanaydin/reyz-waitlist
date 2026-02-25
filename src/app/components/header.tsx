import Image from 'next/image';

export default function Header() {
  return (
    <header className="relative z-10 mx-auto container max-w-7xl px-4 pt-6 flex items-center justify-between pointer-events-auto">
      <Image src="/logo.svg" alt="Reyz.ai" width={80} height={32} />
    </header>
  );
}
