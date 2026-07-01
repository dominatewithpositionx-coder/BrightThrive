import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ✅ use absolute import
import { requireAuth } from '@/lib/auth-guard';

// ✅ Disable static generation for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .select('email, name, source, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const header = ['email', 'name', 'source', 'created_at'];
    const csvLines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.email,
          r.name ?? '',
          r.source ?? '',
          new Date(r.created_at).toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const csv = csvLines.join('\r\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="waitlist_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('❌ Export error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
