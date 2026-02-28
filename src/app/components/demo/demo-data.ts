import type {
  AnimatedMessage,
  Channel,
  ConversationView,
  DirectMessageContact,
  Message,
  User,
  ViewId,
} from './types';

// ─── Users ───────────────────────────────────────────────────────────────────

export const USERS: Record<string, User> = {
  you: {
    id: 'you',
    name: 'You',
    avatarColor: '#3B82F6',
    avatarUrl: '/avatars/you.jpg',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    avatarColor: '#F97316',
    avatarUrl: '/avatars/alex.jpg',
  },
  jane: {
    id: 'jane',
    name: 'Jane',
    avatarColor: '#8B5CF6',
    avatarUrl: '/avatars/jane.svg',
    role: 'PM Agent',
    isAgent: true,
    roleBadge: 'PM',
    badgeColor: 'text-purple-600',
    badgeBg: 'bg-purple-100',
  },
  jack: {
    id: 'jack',
    name: 'Jack',
    avatarColor: '#0EA5E9',
    avatarUrl: '/avatars/jack.svg',
    role: 'Dev Agent',
    isAgent: true,
    roleBadge: 'Dev',
    badgeColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
  },
  simon: {
    id: 'simon',
    name: 'Simon',
    avatarColor: '#6366F1',
    avatarUrl: '/avatars/simon.svg',
    role: 'Dev Agent',
    isAgent: true,
    roleBadge: 'Dev',
    badgeColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
  },
  mary: {
    id: 'mary',
    name: 'Mary',
    avatarColor: '#14B8A6',
    avatarUrl: '/avatars/mary.svg',
    role: 'QA Agent',
    isAgent: true,
    roleBadge: 'QA',
    badgeColor: 'text-teal-600',
    badgeBg: 'bg-teal-100',
  },
};

// ─── Channels ────────────────────────────────────────────────────────────────

export const CHANNELS: Channel[] = [
  { id: 'general', name: 'general', subtitle: 'Company-wide announcements' },
  { id: 'developers', name: 'developers', subtitle: 'Engineering team discussions' },
  { id: 'design', name: 'design', subtitle: 'Design reviews & feedback' },
  { id: 'product', name: 'product', subtitle: 'Product roadmap & planning' },
  { id: 'random', name: 'random', subtitle: 'Water cooler chat' },
  { id: 'support', name: 'support', subtitle: 'Customer support triage' },
];

// ─── Direct Message Contacts ─────────────────────────────────────────────────

export const DM_CONTACTS: DirectMessageContact[] = [
  { id: 'alex', userId: 'alex' },
  { id: 'jane', userId: 'jane' },
  { id: 'jack', userId: 'jack' },
  { id: 'simon', userId: 'simon' },
  { id: 'mary', userId: 'mary' },
];

// ─── Conversations ───────────────────────────────────────────────────────────

const generalMessages: Message[] = [
  {
    id: 'g1',
    userId: 'jane',
    text: "Good morning team! \u{1F44B} Quick update: I've synced our Linear board with this week's sprint goals. 4 items in the backlog, 2 in progress.",
    timestamp: '9:15 AM',
  },
  {
    id: 'g2',
    userId: 'alex',
    text: "Thanks Jane! I'll review the backlog after my coffee \u2615",
    timestamp: '9:18 AM',
  },
  {
    id: 'g3',
    userId: 'mary',
    text: 'Morning! Just finished the nightly test run \u2014 all green across staging. Full report is in #developers.',
    timestamp: '9:20 AM',
  },
  {
    id: 'g4',
    userId: 'you',
    text: "Great start to the day. Let's aim to close the auth module tickets by EOD.",
    timestamp: '9:25 AM',
  },
  {
    id: 'g5',
    userId: 'jack',
    text: 'Already on it. The token refresh logic is almost done, pushing a PR shortly.',
    timestamp: '9:27 AM',
  },
  {
    id: 'g6',
    userId: 'simon',
    text: "I'll pick up the session management ticket once Jack's PR is ready for review.",
    timestamp: '9:28 AM',
  },
];

const developersStaticMessages: Message[] = [
  {
    id: 'd-s1',
    userId: 'jack',
    text: 'Merged the auth refactor PR. All tests passing \u2705',
    timestamp: 'Yesterday, 4:32 PM',
  },
  {
    id: 'd-s2',
    userId: 'alex',
    text: 'Thanks Jack, great cleanup on this one.',
    timestamp: 'Yesterday, 4:45 PM',
    reactions: [{ emoji: '\u{1F64F}', users: ['You'] }],
  },
];

const developersAnimatedMessages: AnimatedMessage[] = [
  {
    id: 'd-a1',
    userId: 'you',
    text: 'Hey team, users are reporting an error on the product detail page. Jane, can you look into this?',
    timestamp: '10:32 AM',
    typingDuration: 1200,
    pauseAfter: 1500,
  },
  {
    id: 'd-a2',
    userId: 'jane',
    text: 'On it! Let me check Sentry for error traces.',
    timestamp: '10:32 AM',
    typingDuration: 1000,
    pauseAfter: 3000,
    card: {
      type: 'sentry-issue',
      title: 'Sentry: Null pointer exception in ProductDetail',
      subtitle: 'Issue #PD-9082 · 23 events in the last hour',
      iconColor: '#FB4226',
    },
  },
  {
    id: 'd-a3',
    userId: 'jane',
    text: "Found it \u2014 there's a null pointer exception in the price calculation module. I've created a Linear issue with the full stack trace and assigned it to Jack.",
    timestamp: '10:33 AM',
    typingDuration: 1500,
    pauseAfter: 2000,
    card: {
      type: 'linear-issue',
      title: 'BUG-142: Null pointer in price calculation',
      subtitle: 'Priority: High \u00B7 Assigned to: Jack',
      iconColor: '#8B5CF6',
    },
  },
  {
    id: 'd-a4',
    userId: 'jack',
    text: 'Got it. Moving to in-progress. I see the issue \u2014 let me push a fix.',
    timestamp: '10:34 AM',
    typingDuration: 1000,
    pauseAfter: 4000,
  },
  {
    id: 'd-a5',
    userId: 'jack',
    text: 'Fix is ready. Opened a PR and assigned Simon for review.',
    timestamp: '10:38 AM',
    typingDuration: 1200,
    pauseAfter: 2000,
    card: {
      type: 'github-pr',
      title: 'fix: handle null price in ProductDetail #287',
      subtitle: '+12 \u22123 \u00B7 Ready for review',
      iconColor: '#1F2328',
    },
  },
  {
    id: 'd-a6',
    userId: 'simon',
    text: 'Reviewed \u2014 looks clean. Approved \u2713',
    timestamp: '10:40 AM',
    typingDuration: 1000,
    pauseAfter: 1500,
  },
  {
    id: 'd-a7',
    userId: 'jack',
    text: 'Merging and deploying to staging...',
    timestamp: '10:40 AM',
    typingDuration: 1000,
    pauseAfter: 2000,
  },
  {
    id: 'd-a8',
    userId: 'jack',
    text: 'Deployed to staging \u2705',
    timestamp: '10:42 AM',
    typingDuration: 800,
    pauseAfter: 1500,
  },
  {
    id: 'd-a9',
    userId: 'mary',
    text: 'Running automated tests on staging...',
    timestamp: '10:43 AM',
    typingDuration: 1000,
    pauseAfter: 3000,
  },
  {
    id: 'd-a10',
    userId: 'mary',
    text: "All tests passing. Product detail page is working correctly. Here's the test report:",
    timestamp: '10:45 AM',
    typingDuration: 1200,
    pauseAfter: 1500,
    card: {
      type: 'test-results',
      title: 'Test Suite: Product Detail Page',
      subtitle: '12/12 tests passed \u00B7 0 failures',
      iconColor: '#16A34A',
    },
  },
  {
    id: 'd-a11',
    userId: 'you',
    text: 'Great work team, thanks! \u{1F64C}',
    timestamp: '10:45 AM',
    typingDuration: 800,
    pauseAfter: 1000,
    reactions: [{ emoji: '\u2764\uFE0F', users: ['Jane', 'Jack', 'Simon', 'Mary'] }],
  },
];

const designMessages: Message[] = [
  {
    id: 'ds1',
    userId: 'alex',
    text: "I've uploaded the new landing page mockups to Figma. Can someone review?",
    timestamp: '10:00 AM',
  },
  {
    id: 'ds2',
    userId: 'jane',
    text: 'Looks great! I especially like the new hero section. One thought \u2014 should we A/B test the CTA copy?',
    timestamp: '10:05 AM',
  },
  {
    id: 'ds3',
    userId: 'you',
    text: 'Good idea. Let\'s test "Join waitlist" vs "Get early access". Alex, can you prep both variants?',
    timestamp: '10:12 AM',
  },
  {
    id: 'ds4',
    userId: 'alex',
    text: "On it! I'll have both ready by this afternoon.",
    timestamp: '10:14 AM',
  },
];

const productMessages: Message[] = [
  {
    id: 'p1',
    userId: 'jane',
    text: "Updated the Q2 roadmap based on yesterday's planning session. Key priorities: auth v2, dashboard redesign, and API rate limiting.",
    timestamp: '10:00 AM',
  },
  {
    id: 'p2',
    userId: 'you',
    text: "Looks good. Let's make sure the dashboard redesign doesn't slip — it's been requested by 3 enterprise clients.",
    timestamp: '10:05 AM',
  },
  {
    id: 'p3',
    userId: 'alex',
    text: 'I have the design specs ready for the dashboard. We can kick off dev work this week if the team has bandwidth.',
    timestamp: '10:08 AM',
  },
  {
    id: 'p4',
    userId: 'jane',
    text: "I'll check sprint capacity and slot it in. Simon, are you free to take the frontend work?",
    timestamp: '10:10 AM',
  },
];

const randomMessages: Message[] = [
  {
    id: 'r1',
    userId: 'alex',
    text: 'Has anyone tried the new coffee place on 5th? Their cold brew is incredible ☕',
    timestamp: '12:15 PM',
  },
  {
    id: 'r2',
    userId: 'you',
    text: "Not yet but it's on my list! I heard they have great pastries too.",
    timestamp: '12:18 PM',
  },
  {
    id: 'r3',
    userId: 'mary',
    text: "Fun fact: I analyzed our team's coffee consumption data. We average 3.2 cups per person per day 📊",
    timestamp: '12:20 PM',
  },
  {
    id: 'r4',
    userId: 'jack',
    text: 'Those are rookie numbers. We need to pump those up.',
    timestamp: '12:21 PM',
  },
];

const supportMessages: Message[] = [
  {
    id: 'su1',
    userId: 'mary',
    text: 'New ticket from Acme Corp: their webhook endpoint is receiving duplicate events. Investigating now.',
    timestamp: '11:00 AM',
  },
  {
    id: 'su2',
    userId: 'jack',
    text: 'Could be related to the retry logic I deployed last week. Let me check the idempotency keys.',
    timestamp: '11:02 AM',
  },
  {
    id: 'su3',
    userId: 'mary',
    text: 'Confirmed — the retry window was set to 30s but some webhooks take 45s to ACK. Jack, can you bump the timeout?',
    timestamp: '11:05 AM',
  },
  {
    id: 'su4',
    userId: 'jack',
    text: 'Done, bumped to 60s with exponential backoff. Deployed to production.',
    timestamp: '11:08 AM',
  },
];

const dmJaneMessages: Message[] = [
  {
    id: 'dj1',
    userId: 'jane',
    text: "Hey! I put together a summary of this week's progress for the investor update. Want me to share it in #general or would you prefer to review it first?",
    timestamp: 'Yesterday, 2:00 PM',
  },
  {
    id: 'dj2',
    userId: 'you',
    text: 'Let me review it first. Can you send me the draft?',
    timestamp: 'Yesterday, 2:05 PM',
  },
  {
    id: 'dj3',
    userId: 'jane',
    text: "Here you go \u2014 I've attached the draft. Key highlights: 23% improvement in API response times, auth module 80% complete, and 3 new integrations shipped.",
    timestamp: 'Yesterday, 2:06 PM',
  },
  {
    id: 'dj4',
    userId: 'you',
    text: "This looks solid. Let's add the customer feedback metrics too before sharing.",
    timestamp: 'Yesterday, 2:15 PM',
  },
  {
    id: 'dj5',
    userId: 'jane',
    text: 'Done! Updated the draft with NPS scores and support ticket trends. Ready whenever you are \u2728',
    timestamp: 'Yesterday, 2:16 PM',
  },
];

const dmAlexMessages: Message[] = [
  {
    id: 'da1',
    userId: 'you',
    text: 'Hey Alex, what do you think about adding a dark mode to the app? Lots of requests coming in.',
    timestamp: 'Yesterday, 11:00 AM',
  },
  {
    id: 'da2',
    userId: 'alex',
    text: "I was actually thinking about that! I have some design concepts I've been playing with. Give me a day and I'll put together a proper proposal.",
    timestamp: 'Yesterday, 11:03 AM',
  },
  {
    id: 'da3',
    userId: 'you',
    text: "Perfect. No rush \u2014 whenever you're ready.",
    timestamp: 'Yesterday, 11:05 AM',
  },
  {
    id: 'da4',
    userId: 'alex',
    text: 'Just shared the dark mode concepts in #design. Let me know what you think \u{1F3A8}',
    timestamp: 'Yesterday, 3:30 PM',
  },
];

const dmJackMessages: Message[] = [
  {
    id: 'dk1',
    userId: 'you',
    text: "Jack, what's the status on the API rate limiter?",
    timestamp: 'Today, 9:00 AM',
  },
  {
    id: 'dk2',
    userId: 'jack',
    text: "Almost there. I've implemented token bucket algorithm with Redis backing. Running load tests now \u2014 preliminary results show it handles 10k req/s without breaking a sweat.",
    timestamp: 'Today, 9:01 AM',
  },
  {
    id: 'dk3',
    userId: 'you',
    text: 'Great, keep me posted on the load test results.',
    timestamp: 'Today, 9:03 AM',
  },
];

const dmSimonMessages: Message[] = [
  {
    id: 'dsi1',
    userId: 'simon',
    text: 'I finished the code review checklist you asked for. It covers security patterns, performance bottlenecks, and test coverage requirements. Should I share it with the team?',
    timestamp: 'Monday, 10:00 AM',
  },
  {
    id: 'dsi2',
    userId: 'you',
    text: 'Yes please, drop it in #developers.',
    timestamp: 'Monday, 10:05 AM',
  },
  {
    id: 'dsi3',
    userId: 'simon',
    text: 'Posted! Let me know if you want me to adjust any of the review criteria.',
    timestamp: 'Monday, 10:06 AM',
  },
];

const dmMaryMessages: Message[] = [
  {
    id: 'dm1',
    userId: 'mary',
    text: 'Nightly regression suite completed. 147 tests, all passing. I noticed a slight performance regression on the search endpoint \u2014 response time went from 120ms to 180ms. Not critical but worth monitoring.',
    timestamp: 'Today, 8:30 AM',
  },
  {
    id: 'dm2',
    userId: 'you',
    text: "Thanks for flagging it. Let's keep an eye on it for a few days before creating a ticket.",
    timestamp: 'Today, 8:35 AM',
  },
  {
    id: 'dm3',
    userId: 'mary',
    text: "Sounds good. I'll set up an automated alert if it crosses 200ms.",
    timestamp: 'Today, 8:36 AM',
  },
];

// ─── Conversation Map ────────────────────────────────────────────────────────

export const CONVERSATIONS: Record<ViewId, ConversationView> = {
  general: {
    headerTitle: '# general',
    headerSubtitle: 'Company-wide announcements',
    staticMessages: generalMessages,
  },
  developers: {
    headerTitle: '# developers',
    headerSubtitle: 'Engineering team discussions',
    staticMessages: developersStaticMessages,
    animatedMessages: developersAnimatedMessages,
  },
  design: {
    headerTitle: '# design',
    headerSubtitle: 'Design reviews & feedback',
    staticMessages: designMessages,
  },
  product: {
    headerTitle: '# product',
    headerSubtitle: 'Product roadmap & planning',
    staticMessages: productMessages,
  },
  random: {
    headerTitle: '# random',
    headerSubtitle: 'Water cooler chat',
    staticMessages: randomMessages,
  },
  support: {
    headerTitle: '# support',
    headerSubtitle: 'Customer support triage',
    staticMessages: supportMessages,
  },
  'dm-jane': {
    headerTitle: 'Jane',
    headerSubtitle: 'PM Agent',
    staticMessages: dmJaneMessages,
  },
  'dm-alex': {
    headerTitle: 'Alex',
    staticMessages: dmAlexMessages,
  },
  'dm-jack': {
    headerTitle: 'Jack',
    headerSubtitle: 'Dev Agent',
    staticMessages: dmJackMessages,
  },
  'dm-simon': {
    headerTitle: 'Simon',
    headerSubtitle: 'Dev Agent',
    staticMessages: dmSimonMessages,
  },
  'dm-mary': {
    headerTitle: 'Mary',
    headerSubtitle: 'QA Agent',
    staticMessages: dmMaryMessages,
  },
};
