import { LayerIcon, RoboticIcon, SidebarLeftIcon, Store01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';

import type { ViewId } from './types';

import { CHANNELS, DM_CONTACTS, USERS } from './demo-data';

interface DemoSidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  isOpen: boolean | null;
  onToggle: () => void;
}

function UserAvatar({ userId, size = 'sm' }: { size?: 'sm' | 'xs'; userId: string }) {
  const user = USERS[userId];
  const sizeClass = size === 'sm' ? 'h-5 w-5' : 'h-5 w-5';
  const sizePx = size === 'sm' ? 20 : 20;

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={sizePx}
        height={sizePx}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full`}
      style={{ backgroundColor: user.avatarColor }}
    />
  );
}

const MENU_ITEMS = [
  { icon: RoboticIcon, label: 'Agents' },
  { icon: LayerIcon, label: 'Skills' },
  { icon: Store01Icon, label: 'Marketplace' },
] as const;

export default function DemoSidebar({
  activeView,
  onViewChange,
  isOpen,
  onToggle,
}: DemoSidebarProps) {
  const sidebarStateClass =
    isOpen === null
      ? 'w-0 border-r-0 md:w-[256px] md:border-r md:border-white/55'
      : isOpen
        ? 'w-[256px] border-r border-white/55'
        : 'w-0 border-r-0';

  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-2xl backdrop-saturate-180 transition-[width] duration-200 ${sidebarStateClass}`}
    >
      {/* Traffic light dots + toggle */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#FF5F57]" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#FFBD2E]" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#27C93F]" />
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-700"
          aria-label="Collapse sidebar"
        >
          <HugeiconsIcon icon={SidebarLeftIcon} size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3.5 pb-2 pt-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
          A
        </div>
        <span className="truncate text-sm font-semibold text-gray-900">Acme Labs</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 mt-1">
        {/* Menu items */}
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-[background-color,color,backdrop-filter] duration-150 hover:border-black/5 hover:backdrop-blur-xl hover:backdrop-saturate-150"
          >
            <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.5} className="shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Channels */}
        <SectionLabel className="mt-2 mb-1">Channels</SectionLabel>
        <div className="flex flex-col gap-px">
          {CHANNELS.map((channel) => (
            <SidebarItem
              key={channel.id}
              active={activeView === channel.id}
              onClick={() => onViewChange(channel.id)}
            >
              <span className="font-mono text-xs">#</span>
              <span className="truncate">{channel.name}</span>
            </SidebarItem>
          ))}
        </div>

        {/* Direct Messages */}
        <SectionLabel className="mt-2 mb-1">Direct Messages</SectionLabel>
        <div className="flex flex-col gap-px">
          {DM_CONTACTS.map((dm) => {
            const user = USERS[dm.userId];
            const viewId: ViewId = `dm-${dm.id}`;
            return (
              <SidebarItem
                key={dm.id}
                active={activeView === viewId}
                onClick={() => onViewChange(viewId)}
              >
                <UserAvatar userId={dm.userId} size="xs" />
                <span className="truncate">{user.name}</span>
                {user.isAgent && <span className="text-xs">{'\u{1F916}'}</span>}
                {user.roleBadge && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-1.5 py-px text-xs font-medium ${user.badgeBg} ${user.badgeColor}`}
                  >
                    {user.roleBadge}
                  </span>
                )}
              </SidebarItem>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`px-2 pb-0.5 pt-2 text-xs font-semibold text-gray-500 ${className}`}>
      {children}
    </p>
  );
}

function SidebarItem({
  children,
  active,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-[background-color,color,backdrop-filter] duration-150 ${
        active
          ? 'border-black/5 backdrop-blur-xl backdrop-saturate-150'
          : 'hover:border-black/5 hover:backdrop-blur-xl hover:backdrop-saturate-150'
      }`}
    >
      {children}
    </button>
  );
}
