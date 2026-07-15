// Growth Superpowers V1
// Five identity tags. Every AI-generated mission maps to exactly one.
// This file is the single source of truth — used by the generate-missions
// route (INSERT), child reflection UI, parent recognition panel, and analytics.

export type SuperpowerTag =
  | 'boundary_builder'
  | 'focus_finder'
  | 'self_soother'
  | 'autonomy_builder'
  | 'team_player';

export const SUPERPOWER_TAGS: SuperpowerTag[] = [
  'boundary_builder',
  'focus_finder',
  'self_soother',
  'autonomy_builder',
  'team_player',
];

export interface Superpower {
  tag: SuperpowerTag;
  /** Child-facing display name */
  label: string;
  /** Short description shown to child */
  childDescription: string;
  /** Emoji used as visual badge */
  emoji: string;
  /** Reflection prompt shown to child after mission completion */
  reflectionPrompt: string;
  /** Three process-praise templates for parents.
   *  Use {name} as the placeholder for the child's first name.
   *  Templates describe only verified facts — no unobserved behaviour claims. */
  parentTemplates: [string, string, string];
}

export const SUPERPOWERS: Record<SuperpowerTag, Superpower> = {
  boundary_builder: {
    tag: 'boundary_builder',
    label: 'Boundary Builder',
    childDescription: 'Knowing your limits and respecting them',
    emoji: '🛡️',
    reflectionPrompt: 'Which special skill helped you finish this quest?',
    parentTemplates: [
      '{name}, I saw that you completed your mission today. I\'m proud that you followed through.',
      '{name}, you put real effort into finishing what you started. That kind of follow-through matters.',
      '{name}, completing that mission showed real inner strength. I\'m proud of you.',
    ],
  },
  focus_finder: {
    tag: 'focus_finder',
    label: 'Focus Finder',
    childDescription: 'Staying with something even when it gets tricky',
    emoji: '🎯',
    reflectionPrompt: 'Which special skill helped you finish this quest?',
    parentTemplates: [
      '{name}, I saw that you completed your mission today. Staying focused takes real effort — I\'m proud of you.',
      '{name}, you put real effort into finishing what you started. That kind of attention is a skill.',
      '{name}, completing that mission showed growing focus and persistence. Well done.',
    ],
  },
  self_soother: {
    tag: 'self_soother',
    label: 'Self-Soother',
    childDescription: 'Taking care of your feelings in a healthy way',
    emoji: '🌊',
    reflectionPrompt: 'Which special skill helped you finish this quest?',
    parentTemplates: [
      '{name}, I saw that you completed your mission today. Taking care of yourself takes courage.',
      '{name}, you put real effort into finishing what you started. That shows real self-awareness.',
      '{name}, completing that mission showed you know how to take care of yourself. I\'m proud of that.',
    ],
  },
  autonomy_builder: {
    tag: 'autonomy_builder',
    label: 'Autonomy Builder',
    childDescription: 'Getting things done on your own',
    emoji: '🚀',
    reflectionPrompt: 'Which special skill helped you finish this quest?',
    parentTemplates: [
      '{name}, I saw that you completed your mission today. I\'m proud that you took initiative.',
      '{name}, you put real effort into finishing what you started. Doing things independently is a big deal.',
      '{name}, completing that mission showed growing independence. That makes me really proud.',
    ],
  },
  team_player: {
    tag: 'team_player',
    label: 'Team Player',
    childDescription: 'Showing up for the people around you',
    emoji: '🤝',
    reflectionPrompt: 'Which special skill helped you finish this quest?',
    parentTemplates: [
      '{name}, I saw that you completed your mission today. Showing up for others is one of the best things a person can do.',
      '{name}, you put real effort into finishing what you started. Your commitment to the people around you matters.',
      '{name}, completing that mission showed real kindness and teamwork. I\'m proud of you.',
    ],
  },
};

/** Returns the Superpower for a given tag, or null if unrecognised. */
export function getSuperpower(tag: string | null | undefined): Superpower | null {
  if (!tag) return null;
  return SUPERPOWERS[tag as SuperpowerTag] ?? null;
}

/** Fills {name} placeholder in a template string. */
export function fillTemplate(template: string, childName: string): string {
  return template.replace('{name}', childName);
}

// ── Category → Superpower mapping ──────────────────────────────────────────
// Used at mission INSERT time in generate-missions route.
// Where multiple superpowers are possible, prefer the most contextually specific.
// This is a TypeScript constant — adjustable without a migration.

export const CATEGORY_TO_SUPERPOWER: Record<string, SuperpowerTag> = {
  emotional_intelligence: 'boundary_builder',
  learning:               'focus_finder',
  mindfulness:            'self_soother',
  responsibility:         'autonomy_builder',
  movement:               'autonomy_builder',
  family_connection:      'team_player',
  kindness:               'team_player',
  creativity:             'team_player',
  outdoor:                'autonomy_builder',
  healthy_habits:         'self_soother',
  adventure:              'autonomy_builder',
  general:                'focus_finder',
};

export function categoryToSuperpowerTag(category: string | null | undefined): SuperpowerTag | null {
  if (!category) return null;
  return CATEGORY_TO_SUPERPOWER[category] ?? null;
}
