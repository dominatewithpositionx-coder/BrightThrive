export type MoodKey = 'Happy' | 'Calm' | 'Energetic' | 'Tired' | 'Sad' | 'Frustrated';

export const MOODS: {
  key: MoodKey;
  emoji: string;
  label: string;
  cardBg: string;
  cardBorder: string;
}[] = [
  { key: 'Happy',      emoji: '😊', label: 'Happy',      cardBg: 'bg-amber-50',  cardBorder: 'border-amber-200' },
  { key: 'Calm',       emoji: '😌', label: 'Calm',       cardBg: 'bg-sky-50',    cardBorder: 'border-sky-200' },
  { key: 'Energetic',  emoji: '⚡', label: 'Excited',    cardBg: 'bg-orange-50', cardBorder: 'border-orange-200' },
  { key: 'Tired',      emoji: '😴', label: 'Tired',      cardBg: 'bg-purple-50', cardBorder: 'border-purple-200' },
  { key: 'Sad',        emoji: '😔', label: 'Sad',        cardBg: 'bg-blue-50',   cardBorder: 'border-blue-200' },
  { key: 'Frustrated', emoji: '😠', label: 'Frustrated', cardBg: 'bg-rose-50',   cardBorder: 'border-rose-200' },
];

export const EI_RESPONSES: Record<MoodKey, {
  headline: string;
  message: string;
  cta: string;
  bg: string;
}> = {
  Happy:      { headline: "I love seeing that smile!", message: "Let's use this amazing energy to do something awesome today.", cta: "Let's go! ✨", bg: 'from-amber-50 to-yellow-50' },
  Calm:       { headline: "You seem peaceful right now.", message: "That's a wonderful feeling. Let's keep the good vibes going.", cta: "Ready! 🌿", bg: 'from-sky-50 to-blue-50' },
  Energetic:  { headline: "You've got so much energy today!", message: "Let's put it to great use. Big things happen on days like this.", cta: "Let's do this! ⚡", bg: 'from-orange-50 to-amber-50' },
  Tired:      { headline: "Sounds like your body needs a little kindness today.", message: "That's completely okay. Let's keep things gentle and simple — small steps still count.", cta: "Okay, let's try 💙", bg: 'from-purple-50 to-indigo-50' },
  Sad:        { headline: "It's okay to have sad days.", message: "You don't have to fix everything right now. Let's do one small thing together — you've got this.", cta: "I'm ready 💛", bg: 'from-blue-50 to-sky-50' },
  Frustrated: { headline: "That's okay — everybody feels frustrated sometimes.", message: "Take a deep breath. Let's do something small to help you reset. You're not alone.", cta: "Let's reset 🤝", bg: 'from-rose-50 to-pink-50' },
};

// Injected into the Claude system prompt during mission generation.
export const MOOD_MISSION_HINTS: Record<MoodKey, string> = {
  Happy:      'The child is feeling happy and energetic. Give them creative, social, or outdoor missions that match their positive energy.',
  Calm:       'The child is feeling calm and peaceful. Give them gentle, mindful, or creative missions — reading, art, journaling, or quiet activities.',
  Energetic:  'The child is feeling very energetic. Prioritize physical activity, movement challenges, or helping-around-the-house missions.',
  Tired:      'The child is feeling tired. Give them very gentle, short missions — simple kindness acts, light stretching, or low-effort reading.',
  Sad:        'The child is feeling sad. Give them warm, comforting missions — small wins they can definitely achieve, kindness acts, or connection activities.',
  Frustrated: 'The child is feeling frustrated. Give them reset missions — short physical activity, deep breathing prompts, or simple creative tasks to redirect energy.',
};
