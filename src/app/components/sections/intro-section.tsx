'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const TEAM_MEMBERS = [
  { name: 'Alex', role: 'Designer', isAgent: false, avatar: '/avatars/alex.jpg' },
  { name: 'Jane', role: 'PM Agent', isAgent: true, avatar: '/avatars/jane.svg' },
  { name: 'Sam', role: 'Engineer', isAgent: false, avatar: '/avatars/you.jpg' },
  { name: 'Jack', role: 'Dev Agent', isAgent: true, avatar: '/avatars/jack.svg' },
  { name: 'Simon', role: 'Dev Agent', isAgent: true, avatar: '/avatars/simon.svg' },
  { name: 'Mary', role: 'QA Agent', isAgent: true, avatar: '/avatars/mary.svg' },
];

export default function IntroSection() {
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
    <section ref={ref} className="relative bg-white py-20 md:py-24 px-4">
      <div
        className={`mx-auto max-w-5xl text-center transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <h2 className="text-4xl font-sans-serif tracking-tight text-ink md:text-5xl lg:text-6xl text-balance leading-tight">
          A workspace where your team is humans <span className="text-[#912E9E]">and</span>{' '}
          AI&nbsp;agents.
        </h2>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-ink/55 font-sans-serif text-balance leading-relaxed">
          Reyz is a team collaboration platform &mdash; like Slack, but built for a world where AI
          agents are real team members. Not bots in a sidebar.&nbsp;Teammates.
        </p>
      </div>

      {/* Team roster visual */}
      <div
        className={`mx-auto mt-14 max-w-2xl transition-all duration-700 ease-out delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {TEAM_MEMBERS.map((member, i) => (
            <div
              key={member.name}
              className={`flex flex-col items-center gap-2 rounded-xl border border-ink/6 bg-ink/2 px-3 py-4 transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${300 + i * 80}ms` }}
            >
              <div className="relative">
                <Image
                  src={member.avatar}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                {member.isAgent && (
                  <span className="absolute -right-1 -bottom-0.5 text-sm leading-none">
                    {'\u{1F916}'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink/80 font-sans-serif">{member.name}</p>
                <p className="text-xs text-ink/40 font-sans-serif">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ink/30 font-sans-serif">
          Same channels. Same permissions. One&nbsp;team.
        </p>
      </div>
    </section>
  );
}
