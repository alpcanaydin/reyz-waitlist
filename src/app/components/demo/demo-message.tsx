import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import type { EmbeddedCard, Message, User } from './types';

interface DemoMessageProps {
  countUpReactions?: boolean;
  message: Message;
  user: User;
  animated?: boolean;
  showReactions?: boolean;
}

export default function DemoMessage({
  message,
  user,
  animated,
  showReactions,
  countUpReactions,
}: DemoMessageProps) {
  const hasAgentBadge = Boolean(user.isAgent && user.roleBadge && user.badgeBg && user.badgeColor);
  const displayRole = user.role && !hasAgentBadge ? ` \u00B7 ${user.role}` : '';
  const reactionTargets = useMemo(() => message.reactions ?? [], [message.reactions]);
  const totalReactionSteps = reactionTargets.reduce(
    (sum, reaction) => sum + reaction.users.length,
    0,
  );
  const [reactionStep, setReactionStep] = useState(0);

  useEffect(() => {
    if (!countUpReactions || totalReactionSteps === 0) return;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    let currentStep = 0;

    const incrementNext = () => {
      currentStep += 1;
      setReactionStep(currentStep);
      if (currentStep < totalReactionSteps) {
        const timer = setTimeout(incrementNext, 180);
        timers.add(timer);
      }
    };

    const firstTimer = setTimeout(incrementNext, 120);
    timers.add(firstTimer);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [countUpReactions, totalReactionSteps]);

  const reactionCounts = reactionTargets.map((reaction, index) => {
    if (!countUpReactions) return reaction.users.length;

    const priorTotal = reactionTargets
      .slice(0, index)
      .reduce((sum, currentReaction) => sum + currentReaction.users.length, 0);
    return Math.max(0, Math.min(reaction.users.length, reactionStep - priorTotal));
  });

  return (
    <div className={`flex gap-3 px-5 py-1.5 ${animated ? 'animate-message-in' : ''}`}>
      <Avatar user={user} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold">{user.name}</span>
          {user.isAgent && <span className="text-xs leading-none">{'\u{1F916}'}</span>}
          {hasAgentBadge && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium ${user.badgeBg} ${user.badgeColor}`}
            >
              {user.roleBadge}
            </span>
          )}
          {displayRole && <span className="text-xs text-gray-400">{displayRole}</span>}
          <span className="ml-auto text-xs text-gray-400 tabular-nums">{message.timestamp}</span>
        </div>

        <p className="text-sm leading-relaxed">{message.text}</p>

        {message.card && <EmbeddedCardView card={message.card} />}

        {(showReactions ?? true) && message.reactions && (
          <div className="mt-2 flex gap-1.5">
            {message.reactions.map((reaction, i) => (
              <span
                key={reaction.emoji}
                className="inline-flex items-center gap-1 rounded-full bg-black/4 px-2 py-0.5 text-xs animate-reaction-pop"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {reaction.emoji} {reactionCounts[i] ?? reaction.users.length}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: user.avatarColor }}
    >
      {user.name[0]}
    </div>
  );
}

function CardIcon({ card }: { card: EmbeddedCard }) {
  if (card.type === 'linear-issue' || card.type === 'github-pr' || card.type === 'sentry-issue') {
    const logoSrc =
      card.type === 'linear-issue'
        ? '/linear.svg'
        : card.type === 'github-pr'
          ? '/github.svg'
          : '/sentry.svg';
    const logoAlt =
      card.type === 'linear-issue' ? 'Linear' : card.type === 'github-pr' ? 'GitHub' : 'Sentry';

    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-black/10">
        <Image src={logoSrc} alt={logoAlt} width={14} height={14} className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
      style={{ backgroundColor: card.iconColor }}
    >
      <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
      </svg>
    </div>
  );
}

function EmbeddedCardView({ card }: { card: EmbeddedCard }) {
  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
      <CardIcon card={card} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{card.title}</p>
        <p className="text-xs text-gray-500">{card.subtitle}</p>
      </div>
    </div>
  );
}
