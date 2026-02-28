export interface AnimatedMessage extends Message {
  typingDuration: number;
  pauseAfter: number;
}

export interface Channel {
  id: ChannelId;
  name: string;
  subtitle: string;
}

export type ChannelId = 'design' | 'developers' | 'general' | 'product' | 'random' | 'support';

export interface ConversationView {
  headerTitle: string;
  headerSubtitle?: string;
  staticMessages: Message[];
  animatedMessages?: AnimatedMessage[];
}

export interface DirectMessageContact {
  id: DmId;
  userId: string;
}

export type DmId = 'alex' | 'jack' | 'jane' | 'mary' | 'simon';

export interface EmbeddedCard {
  type: 'github-pr' | 'linear-issue' | 'sentry-issue' | 'test-results';
  title: string;
  subtitle: string;
  iconColor: string;
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  card?: EmbeddedCard;
  reactions?: Reaction[];
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  role?: string;
  isAgent?: boolean;
  roleBadge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

export type ViewId = `dm-${DmId}` | ChannelId;
