// Analytics event layer — structured event helpers.
// Wire PostHog by setting NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST in env.
// Fails silently if the key is absent — never blocks app functionality.

type EventName =
  | 'signup_completed'
  | 'child_added'
  | 'mood_selected'
  | 'mission_generated'
  | 'mission_completed'
  | 'reward_created'
  | 'reward_redeemed'
  | 'location_saved'
  | 'install_prompt_shown'
  | 'install_prompt_accepted'
  | 'install_prompt_dismissed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'weekly_email_sent'
  | 'streak_achieved'
  | 'kid_view_opened'
  | 'weekly_summary_viewed'
  | 'win_recorded'
  // FW-01: Growth Superpowers + Parent Recognition + Proud Moment
  | 'growth_superpower_reflection_shown'
  | 'growth_superpower_reflection_selected'
  | 'growth_superpower_reflection_skipped'
  | 'parent_recognition_prompt_viewed'
  | 'parent_recognition_template_selected'
  | 'parent_recognition_edited'
  | 'parent_recognition_sent'
  | 'proud_moment_displayed'
  | 'proud_moment_opened';

type EventProps = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_KEY = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '')
  : '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

function emit(event: EventName, props?: EventProps) {
  if (!POSTHOG_KEY) return;
  try {
    fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        properties: { ...props, $lib: 'web' },
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {}); // fire-and-forget, swallow network errors
  } catch {
    // never throw from analytics
  }
}

// ── Typed event helpers ─────────────────────────────────────────────────────

export function trackSignupCompleted(props: { method: 'email' | 'google' }) {
  emit('signup_completed', props);
}

export function trackChildAdded(props: { child_age?: number | null }) {
  emit('child_added', props);
}

export function trackMoodSelected(props: { mood: string; child_id: string }) {
  emit('mood_selected', props);
}

export function trackMissionGenerated(props: {
  child_id: string;
  mood: string | null;
  weather_available: boolean;
  count: number;
}) {
  emit('mission_generated', props);
}

export function trackMissionCompleted(props: {
  child_id: string;
  mission_id: string;
  title: string;
}) {
  emit('mission_completed', props);
}

export function trackRewardCreated(props: { coin_cost: number }) {
  emit('reward_created', props);
}

export function trackRewardRedeemed(props: {
  child_id: string;
  reward_title: string;
  coin_cost: number;
}) {
  emit('reward_redeemed', props);
}

export function trackLocationSaved() {
  emit('location_saved');
}

export function trackInstallPromptShown() {
  emit('install_prompt_shown');
}

export function trackInstallPromptAccepted() {
  emit('install_prompt_accepted');
}

export function trackInstallPromptDismissed() {
  emit('install_prompt_dismissed');
}

export function trackOnboardingStep(props: { step: number; key: string }) {
  emit('onboarding_step_completed', props);
}

export function trackOnboardingCompleted(props: {
  primary_goal: string;
  selected_habits_count: number;
}) {
  emit('onboarding_completed', props);
}

export function trackStreakAchieved(props: { child_id: string; streak_days: number }) {
  emit('streak_achieved', props);
}

export function trackKidViewOpened(props: { source: 'dashboard' | 'nav' | 'direct' }) {
  emit('kid_view_opened', props);
}

export function trackWeeklySummaryViewed(props: { child_count: number }) {
  emit('weekly_summary_viewed', props);
}

export function trackWinRecorded(props: { parent_id: string }) {
  emit('win_recorded', props);
}

// ── FW-01: Growth Superpowers + Parent Recognition ────────────────────────

export function trackSuperpowerReflectionShown(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('growth_superpower_reflection_shown', props);
}

export function trackSuperpowerReflectionSelected(props: {
  mission_id: string;
  identity_tag: string;
  selected: 'yes' | 'unsure';
}) {
  emit('growth_superpower_reflection_selected', props);
}

export function trackSuperpowerReflectionSkipped(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('growth_superpower_reflection_skipped', props);
}

export function trackParentRecognitionPromptViewed(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('parent_recognition_prompt_viewed', props);
}

export function trackParentRecognitionTemplateSelected(props: {
  mission_id: string;
  identity_tag: string;
  template_index: number;
}) {
  emit('parent_recognition_template_selected', props);
}

export function trackParentRecognitionEdited(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('parent_recognition_edited', props);
}

export function trackParentRecognitionSent(props: {
  mission_id: string;
  identity_tag: string;
  edited: boolean;
  message_length: number;
}) {
  emit('parent_recognition_sent', props);
}

export function trackProudMomentDisplayed(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('proud_moment_displayed', props);
}

export function trackProudMomentOpened(props: {
  mission_id: string;
  identity_tag: string;
}) {
  emit('proud_moment_opened', props);
}
