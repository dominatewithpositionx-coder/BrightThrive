import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, email, source, website } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/waitlist`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        email,
        name: name || null,
        source: source || 'site',
        website: website || null,
        // 🟢 removed joined_at because Supabase auto-generates it
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Supabase insert failed:', text);
      return NextResponse.json(
        { error: 'Supabase insert failed', details: text },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('❌ Waitlist API Error:', err);
    return NextResponse.json(
      { message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
