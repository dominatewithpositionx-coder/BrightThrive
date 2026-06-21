// Analytics event layer — structured event helpers.
// Currently console-logs in dev. Wire to PostHog/Amplitude/etc. by replacing `emit`.

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
  | 'weekly_email_sent';

type EventProps = Record<string, string | number | boolean | null | undefined>;

function emit(event: EventName, props?: EventProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[analytics] ${event}`, props ?? {});
  }
  // TODO: replace with PostHog/Amplitude when wiring analytics
  // posthog.capture(event, props)
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
