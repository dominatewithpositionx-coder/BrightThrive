import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getWeather, weatherMissionHint } from '@/lib/weather';

export const runtime = 'nodejs';

function today() {
  return new Date().toISOString().split('T')[0];
}

const MOOD_HINTS: Record<string, string> = {
  Happy:      'The child is feeling happy and energetic. Give them creative, social, or outdoor missions that match their positive energy.',
  Calm:       'The child is feeling calm and peaceful. Give them gentle, mindful, or creative missions — reading, art, journaling, or quiet activities.',
  Energetic:  'The child is feeling very energetic. Prioritize physical activity, movement challenges, or helping-around-the-house missions.',
  Tired:      'The child is feeling tired. Give them very gentle, short missions — simple kindness acts, light stretching, or low-effort reading.',
  Sad:        'The child is feeling sad. Give them warm, comforting missions — small wins they can definitely achieve, kindness acts, or connection activities.',
  Frustrated: 'The child is feeling frustrated. Give them reset missions — short physical activity, deep breathing prompts, or simple creative tasks to redirect energy.',
};

const BASE_SYSTEM_PROMPT = `You are a warm, encouraging assistant that generates personalized daily missions for children.
Missions should be:
- Quick to complete (5–20 minutes each)
- Educational, character-building, or helpful
- Fun and encouraging — framed as "missions" not chores
- Varied: learning, kindness, movement, creativity, helping at home
- Age-appropriate and emotionally supportive

Respond ONLY with a valid JSON array. No explanation, no markdown, no backticks. Example:
[{"title":"Read for 15 minutes","description":"Pick your favorite book and read quietly"},{"title":"Help set the table","description":"Set out plates, cups, and silverware before dinner"}]`;

export async function POST(req: NextRequest) {
  const { childId, childName, childAge, count = 5, mood } = await req.json();

  if (!childId || !childName) {
    return NextResponse.json({ error: 'childId and childName are required' }, { status: 400 });
  }

  // Verify authenticated parent owns this child via RLS
  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!callerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${callerToken}` } } }
  );
  const { data: { user } } = await anonSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: childRow } = await anonSupabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!childRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Build context: weather + mood
  let systemPrompt = BASE_SYSTEM_PROMPT;
  const contextParts: string[] = [];

  try {
    const { data: plan } = await anonSupabase
      .from('family_plans')
      .select('personalization_data')
      .eq('parent_id', user.id)
      .single();
    const location = (plan?.personalization_data as Record<string, unknown>)?.location as string | undefined;
    if (location) {
      const weather = await getWeather(location);
      if (weather) contextParts.push(`${weather.summary} ${weatherMissionHint(weather)}`);
    }
  } catch {
    // Weather optional — proceed without it
  }

  if (mood && MOOD_HINTS[mood]) {
    contextParts.push(MOOD_HINTS[mood]);
  }

  if (contextParts.length > 0) {
    systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nContext: ${contextParts.join(' ')}`;
  }

  // Generate with Claude
  let missions: { title: string; description?: string }[] = [];
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} missions for ${childName}, who is ${childAge ? `${childAge} years old` : 'a child'}.`,
        },
      ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    missions = JSON.parse(text);
  } catch (err) {
    console.error('Claude generation failed:', err);
    missions = [
      { title: 'Make your bed', description: 'Start the day with a tidy room' },
      { title: 'Read for 15 minutes', description: 'Pick any book you enjoy' },
      { title: 'Help with dishes', description: 'Rinse or put away dishes after a meal' },
      { title: 'Do 10 jumping jacks', description: 'Get your body moving and energized' },
      { title: 'Write 3 things you are grateful for', description: 'Think about what makes you happy' },
    ].slice(0, count);
  }

  await supabase.from('missions').delete().eq('child_id', childId).eq('is_completed', false);

  const missionDate = today();
  const { data, error } = await supabase
    .from('missions')
    .insert(missions.map((m) => ({
      child_id: childId,
      title: m.title,
      category: 'general',
      screen_time_reward: 0,
      is_completed: false,
      mission_date: missionDate,
      status: 'active',
    })))
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, generated: missions.length });
}
