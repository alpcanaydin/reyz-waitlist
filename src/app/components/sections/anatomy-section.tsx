'use client';

import { useEffect, useRef, useState } from 'react';

interface AnatomyCardProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  delay: number;
  visible: boolean;
}

export default function AnatomySection() {
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
      <div className="mx-auto max-w-6xl">
        <div
          className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-ink/40 font-sans-serif">
            Agent Anatomy
          </p>
          <h2 className="mt-5 text-center text-4xl font-sans-serif tracking-tight text-ink md:text-5xl lg:text-6xl">
            Role. Skills. Tools.
          </h2>
          <p className="mt-6 mx-auto max-w-2xl text-center text-lg text-ink/55 font-sans-serif text-balance leading-relaxed">
            Every agent is composed of three building blocks. Define what it knows, how it thinks,
            and what it can do.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <AnatomyCard
            title="Role"
            description="The personality and expertise. A PM agent thinks like a PM &mdash; triaging issues, writing specs, tracking milestones. Define tone, focus area, and behavioral guidelines in plain language."
            visual={<RoleVisual />}
            delay={0}
            visible={visible}
          />
          <AnatomyCard
            title="Skills"
            description="Installable knowledge templates. Teach your agents structured workflows for specific tasks &mdash; from code review checklists to deployment playbooks. Share and reuse across teams."
            visual={<SkillsVisual />}
            delay={100}
            visible={visible}
          />
          <AnatomyCard
            title="Tools"
            description="Connectors to the services your team already uses &mdash; GitHub, Linear, Sentry, Figma. Plus built-in capabilities like web search and code execution."
            visual={<ToolsVisual />}
            delay={200}
            visible={visible}
          />
        </div>
      </div>
    </section>
  );
}

function AnatomyCard({ title, description, visual, delay, visible }: AnatomyCardProps) {
  return (
    <div
      className={`rounded-2xl border border-ink/6 bg-white p-8 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-6 h-[88px] flex items-end">{visual}</div>
      <h3 className="text-xl font-medium text-ink font-sans-serif">{title}</h3>
      <p className="mt-3 text-lg leading-relaxed text-ink/55 font-sans-serif">{description}</p>
    </div>
  );
}

function RoleVisual() {
  return (
    <div className="rounded-xl bg-ink/3 p-4 font-mono text-xs text-ink/60 leading-relaxed w-full">
      <div>
        <span className="text-purple-500">name</span>: &quot;Jane&quot;
      </div>
      <div>
        <span className="text-purple-500">role</span>: &quot;PM Agent&quot;
      </div>
      <div>
        <span className="text-purple-500">focus</span>: &quot;project management&quot;
      </div>
      <div>
        <span className="text-purple-500">tone</span>: &quot;proactive, structured&quot;
      </div>
    </div>
  );
}

function SkillsVisual() {
  const skills = ['Code Review', 'Sprint Planning', 'Bug Triage', 'Deployment', 'Onboarding'];
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-ink/8 bg-ink/3 px-3 py-1.5 text-xs font-medium text-ink/60 font-sans-serif"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function ToolsVisual() {
  const connectors = [
    { name: 'GitHub', color: '#1F2328' },
    { name: 'Linear', color: '#5E6AD2' },
    { name: 'Sentry', color: '#FB4226' },
  ];
  const capabilities = ['Web Search', 'Code Exec'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {connectors.map((c) => (
          <span
            key={c.name}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-white font-sans-serif"
            style={{ backgroundColor: c.color }}
          >
            {c.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {capabilities.map((cap) => (
          <span
            key={cap}
            className="rounded-full border border-dashed border-ink/15 px-3 py-1.5 text-xs text-ink/50 font-sans-serif"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}
