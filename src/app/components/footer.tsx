import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="relative bg-white">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-12">
        <Image src="/logo.svg" alt="Reyz" width={64} height={24} />
        <div className="flex items-center gap-6 text-sm text-ink/35 font-sans-serif">
          <span className="inline-flex items-center gap-1">
            <span className="font-[system-ui,sans-serif]">©</span>
            2026 Reyz Inc.
          </span>
        </div>
      </div>
    </footer>
  );
}
