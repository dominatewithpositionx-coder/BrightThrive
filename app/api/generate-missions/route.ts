import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a helpful assistant that generates age-appropriate daily tasks/missions for children.
Tasks should be:
- Quick to complete (10–30 minutes each)
- Educational, character-building, or helpful around the house
- Fun and encouraging — frame them as "missions" not chores
- Varied across categories: learning, kindness, chores, creativity, physical activity
- Appropriate for the child's age

Respond ONLY with a valid JSON array. No explanation, no markdown, no backticks. Example:
[{"title":"Read for 15 minutes","description":"Pick your favorite book and read quietly"},{"title":"Help set the table","description":"Set out plates, cups, and silverware before dinner"}]`;

export async function POST(req: NextRequest) {
  const { childId, childName, childAge, count = 5 } = await req.json();

  if (!childId || !childName) {
    return NextResponse.json({ error: 'childId and childName are required' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Generate missions with Claude
  let missions: { title: string; description?: string }[] = [];
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
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
    // Fallback set if AI call fails
    missions = [
      { title: 'Make your bed', description: 'Start the day with a tidy room' },
      { title: 'Read for 15 minutes', description: 'Pick any book you enjoy' },
      { title: 'Help with dishes', description: 'Rinse or put away dishes after a meal' },
      { title: 'Do 10 jumping jacks', description: 'Get your body moving and energized' },
      { title: 'Write 3 things you are grateful for', description: 'Think about what makes you happy' },
    ].slice(0, count);
  }

  // Archive completed tasks first (mark them as archived so they don't clutter)
  await supabase
    .from('tasks')
    .update({ completed: false })
    .eq('child_id', childId)
    .eq('completed', true);

  // Delete existing incomplete tasks for this child
  await supabase.from('tasks').delete().eq('child_id', childId).eq('completed', false);

  // Insert new missions
  const { data, error } = await supabase
    .from('tasks')
    .insert(missions.map((m) => ({
      child_id: childId,
      title: m.title,
      completed: false,
    })))
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, generated: missions.length });
}
