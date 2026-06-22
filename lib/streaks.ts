import type { SupabaseClient } from '@supabase/supabase-js';

export type StreakResult = { current: number; longest: number };

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

export async function updateStreak(
  supabase: SupabaseClient,
  childId: string,
  completedAnyMissionToday: boolean
): Promise<StreakResult> {
  const { data: existing } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_active_date')
    .eq('child_id', childId)
    .maybeSingle();

  if (!completedAnyMissionToday) {
    return {
      current: existing?.current_streak ?? 0,
      longest: existing?.longest_streak ?? 0,
    };
  }

  const today = todayStr();
  const yesterday = yesterdayStr();

  let current = 1;
  let longest = existing?.longest_streak ?? 0;

  if (existing) {
    if (existing.last_active_date === today) {
      current = existing.current_streak;
    } else if (existing.last_active_date === yesterday) {
      current = existing.current_streak + 1;
    } else {
      current = 1;
    }
  }

  if (current > longest) longest = current;

  await supabase
    .from('streaks')
    .upsert(
      {
        child_id: childId,
        current_streak: current,
        longest_streak: longest,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id' }
    );

  return { current, longest };
}

export function streakBadge(current: number): string | null {
  if (current >= 30) return '🏆 Legend';
  if (current >= 7)  return '⚡ Week Warrior';
  if (current >= 3)  return '🔥 On Fire';
  return null;
}
