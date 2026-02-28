import Image from 'next/image';

import type { User } from './types';

interface DemoTypingIndicatorProps {
  user: User;
}

export default function DemoTypingIndicator({ user }: DemoTypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-2">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.name[0]}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-typing-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">{user.name} is typing...</span>
      </div>
    </div>
  );
}
