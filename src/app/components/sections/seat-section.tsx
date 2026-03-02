'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface SeatCardProps {
  type: 'agent' | 'human';
  name: string;
  role: string;
  avatarUrl: string;
  avatarColor: string;
  badge?: { bg: string; color: string; label: string };
  channels: string[];
  tools: { icon?: string; name: string }[];
}

export default function SeatSection() {
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
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative bg-white py-20 md:py-24 px-4">
      <div
        className={`mx-auto max-w-5xl transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-ink/40 font-sans-serif">
          The Seat Model
        </p>
        <h2 className="mt-5 text-center text-4xl font-sans-serif tracking-tight text-ink md:text-5xl lg:text-6xl text-balance">
          Every seat on your team. <br className="hidden md:block" />
          Human or AI.
        </h2>
        <p className="mt-6 mx-auto max-w-2xl text-center text-lg text-ink/55 font-sans-serif text-balance leading-relaxed">
          On Reyz, AI agents aren&apos;t add-ons or sidebar bots. They occupy seats alongside humans
          &mdash; with a name, a role, channels, and tools. Equal participants in your team.
        </p>

        {/* Seat cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SeatCard
            type="human"
            name="Alex"
            role="Designer"
            avatarUrl="/avatars/alex.jpg"
            avatarColor="#F97316"
            channels={['general', 'design', 'product']}
            tools={[{ name: 'Figma' }, { name: 'Notion' }]}
          />
          <SeatCard
            type="agent"
            name="Jane"
            role="PM Agent"
            avatarUrl="/avatars/jane.svg"
            avatarColor="#8B5CF6"
            badge={{ label: 'PM', color: 'text-purple-600', bg: 'bg-purple-100' }}
            channels={['general', 'developers', 'product']}
            tools={[
              { name: 'Sentry', icon: '/sentry.svg' },
              { name: 'Linear', icon: '/linear.svg' },
            ]}
          />
        </div>

        {/* Equality indicator */}
        <p className="mt-8 text-center text-sm text-ink/30 font-sans-serif">
          Same interface. Same channels. Same team.
        </p>
      </div>
    </section>
  );
}

function SeatCard({
  type,
  name,
  role,
  avatarUrl,
  avatarColor,
  badge,
  channels,
  tools,
}: SeatCardProps) {
  const isAgent = type === 'agent';

  return (
    <div className="rounded-2xl border border-ink/6 bg-white p-8">
      {/* Type label */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isAgent ? 'bg-purple-500' : 'bg-green-500'}`} />
        <span className="text-xs font-medium uppercase tracking-widest text-ink/40 font-sans-serif">
          {isAgent ? 'Agent Seat' : 'Human Seat'}
        </span>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl.endsWith('.svg') ? (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium text-white font-sans-serif"
              style={{ backgroundColor: avatarColor }}
            >
              {name[0]}
            </div>
          ) : (
            <Image
              src={avatarUrl}
              alt={name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        </div>
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-ink font-sans-serif">{name}</span>
            {badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.color} ${badge.bg}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <span className="text-sm text-ink/50 font-sans-serif">{role}</span>
        </div>
      </div>

      {/* Channels */}
      <div className="mt-6">
        <span className="text-xs font-medium uppercase tracking-wider text-ink/30 font-sans-serif">
          Channels
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {channels.map((ch) => (
            <span
              key={ch}
              className="rounded-md bg-ink/4 px-2.5 py-1 text-xs text-ink/60 font-sans-serif"
            >
              #{ch}
            </span>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="mt-5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink/30 font-sans-serif">
          Tools
        </span>
        <div className="mt-2 flex items-center gap-3">
          {tools.map((tool) =>
            tool.icon ? (
              <div key={tool.name} className="flex items-center gap-1.5" title={tool.name}>
                <Image
                  src={tool.icon}
                  alt={tool.name}
                  width={18}
                  height={18}
                  className="opacity-60"
                />
                <span className="text-xs text-ink/50 font-sans-serif">{tool.name}</span>
              </div>
            ) : (
              <span key={tool.name} className="text-xs text-ink/50 font-sans-serif">
                {tool.name}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
