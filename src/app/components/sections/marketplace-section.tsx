'use client';

import { useEffect, useRef, useState } from 'react';

interface TemplateCardProps {
  type: 'role' | 'skill' | 'team';
  title: string;
  subtitle: string;
  delay: number;
  visible: boolean;
}

export default function MarketplaceSection() {
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
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative bg-white py-20 md:py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div
          className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-ink/40 font-sans-serif">
            Marketplace
          </p>
          <h2 className="mt-5 text-center text-4xl font-sans-serif tracking-tight text-ink md:text-5xl lg:text-6xl text-balance">
            Pre-built agents, skills, and&nbsp;teams.
          </h2>
          <p className="mt-6 mx-auto max-w-2xl text-center text-lg text-ink/55 font-sans-serif text-balance leading-relaxed">
            Browse ready-made Roles, Skills, and Team&#8209;in&#8209;a&#8209;Box templates from the
            community. Install in one click and start collaborating instantly.
          </p>
        </div>

        {/* Template cards */}
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          <TemplateCard
            type="team"
            title="Engineering Team"
            subtitle="4 agents &middot; 12 skills &middot; PM, 2 Devs, QA"
            delay={0}
            visible={visible}
          />
          <TemplateCard
            type="team"
            title="Customer Support"
            subtitle="3 agents &middot; 8 skills &middot; Lead, Tier 1, Tier 2"
            delay={80}
            visible={visible}
          />
          <TemplateCard
            type="skill"
            title="Code Review"
            subtitle="Security patterns, performance, test coverage"
            delay={160}
            visible={visible}
          />
          <TemplateCard
            type="role"
            title="Senior DevOps"
            subtitle="Infrastructure monitoring &amp; incident response"
            delay={240}
            visible={visible}
          />
        </div>

        {/* AI Gateway / BYOK */}
        <div
          className={`mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 transition-all duration-700 ease-out delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="text-sm text-ink/30 font-sans-serif">Works with</span>
          {['OpenAI', 'Anthropic', 'Google', 'Mistral'].map((provider) => (
            <span key={provider} className="text-sm font-medium text-ink/25 font-sans-serif">
              {provider}
            </span>
          ))}
          <span className="text-sm text-ink/25 font-sans-serif">
            &middot; Bring your own API keys
          </span>
        </div>
      </div>
    </section>
  );
}

function TemplateCard({ type, title, subtitle, delay, visible }: TemplateCardProps) {
  const typeLabels = {
    team: { label: 'Team-in-a-Box', color: 'text-purple-600', bg: 'bg-purple-50' },
    skill: { label: 'Skill', color: 'text-blue-600', bg: 'bg-blue-50' },
    role: { label: 'Role', color: 'text-teal-600', bg: 'bg-teal-50' },
  };
  const badge = typeLabels[type];

  return (
    <div
      className={`rounded-xl border border-ink/6 bg-white p-5 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color} ${badge.bg}`}
      >
        {badge.label}
      </span>
      <h4 className="mt-3 text-sm font-medium text-ink font-sans-serif">{title}</h4>
      <p className="mt-1 text-xs text-ink/45 font-sans-serif leading-relaxed">{subtitle}</p>
    </div>
  );
}
