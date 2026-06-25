export type DayTheme = {
  name: string;
  emoji: string;
  gradient: string;
  bgLight: string;
  accentColor: string;
  tagline: string;
  focusCategories: string[];
};

const THEMES: DayTheme[] = [
  {
    name: 'Explorer Sunday', emoji: '🌍',
    gradient: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50', accentColor: '#7C3AED',
    tagline: 'Discover something amazing today!',
    focusCategories: ['outdoor', 'creativity', 'learning'],
  },
  {
    name: 'Adventure Monday', emoji: '⚔️',
    gradient: 'from-orange-400 to-amber-500', bgLight: 'bg-amber-50', accentColor: '#F59E0B',
    tagline: 'Your adventure begins now!',
    focusCategories: ['movement', 'learning', 'outdoor'],
  },
  {
    name: 'Nature Tuesday', emoji: '🌿',
    gradient: 'from-green-500 to-emerald-600', bgLight: 'bg-green-50', accentColor: '#10B981',
    tagline: 'Connect with the world around you!',
    focusCategories: ['outdoor', 'movement', 'mindfulness'],
  },
  {
    name: 'Wellness Wednesday', emoji: '💚',
    gradient: 'from-teal-400 to-cyan-500', bgLight: 'bg-teal-50', accentColor: '#14B8A6',
    tagline: 'Take care of your amazing self!',
    focusCategories: ['healthy_habits', 'mindfulness', 'emotional_intelligence'],
  },
  {
    name: 'Thoughtful Thursday', emoji: '💛',
    gradient: 'from-yellow-400 to-amber-500', bgLight: 'bg-yellow-50', accentColor: '#D97706',
    tagline: 'Spread kindness everywhere you go!',
    focusCategories: ['kindness', 'family_connection', 'emotional_intelligence'],
  },
  {
    name: 'Fitness Friday', emoji: '🏆',
    gradient: 'from-rose-400 to-pink-500', bgLight: 'bg-rose-50', accentColor: '#E11D48',
    tagline: 'Move your body, feel amazing!',
    focusCategories: ['movement', 'outdoor', 'healthy_habits'],
  },
  {
    name: 'Family Saturday', emoji: '👨‍👩‍👧',
    gradient: 'from-blue-400 to-indigo-500', bgLight: 'bg-blue-50', accentColor: '#3B82F6',
    tagline: 'Together is always better!',
    focusCategories: ['family_connection', 'creativity', 'kindness'],
  },
];

export function getDayTheme(): DayTheme {
  return THEMES[new Date().getDay()];
}

export default THEMES;
