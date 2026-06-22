import Link from 'next/link';

type EmptyStateProps = {
  emoji: string;
  headline: string;
  body: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

export default function EmptyState({ emoji, headline, body, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-5xl mb-4 select-none">{emoji}</div>
      <h3 className="text-lg font-semibold text-navy mb-2">{headline}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">{body}</p>
      {cta && (
        cta.href ? (
          <Link
            href={cta.href}
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {cta.label}
          </Link>
        ) : (
          <button
            onClick={cta.onClick}
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}

// Pre-defined empty states for each screen — import the one you need
export const EMPTY_STATES = {
  noChildren: {
    emoji: '🌱',
    headline: 'Add your first child to get started',
    body: "Once you add a child, they'll get daily missions, earn coins, and you'll see their progress here.",
    cta: { label: 'Add a child', href: '/dashboard/children' },
  },
  noMissions: {
    emoji: '🎯',
    headline: 'No missions yet today',
    body: "Start with a mood check-in and BrytThrive will generate 5 personalized missions.",
    cta: { label: 'Generate missions', href: '/child' },
  },
  noRewards: {
    emoji: '⭐',
    headline: 'No rewards set up yet',
    body: "Create a reward — screen time, a treat, a trip to the park. Kids work harder when they know what they're earning.",
    cta: { label: 'Create a reward', href: '/dashboard/rewards' },
  },
  noHistory: {
    emoji: '📅',
    headline: 'No activity yet',
    body: "Completed missions and earned coins will show up here. Start your first mission to see the magic.",
    cta: { label: 'Start a mission', href: '/child' },
  },
  noWallet: {
    emoji: '🪙',
    headline: 'No coins earned yet',
    body: "Coins are earned by completing missions. Finish your first mission to start building your balance.",
    cta: { label: 'Go to missions', href: '/child' },
  },
  noStreaks: {
    emoji: '🔥',
    headline: 'Start your first streak',
    body: "Complete missions 2 days in a row to start a streak. Streaks build momentum and confidence.",
    cta: { label: 'Start today', href: '/child' },
  },
} as const;
