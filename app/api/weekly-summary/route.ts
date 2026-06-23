// Weekly AI Parent Summary — backend structure only.
// Auto-send is NOT wired yet. A future Vercel cron (0 8 * * 1) will POST here
// with { parent_id, dry_run: false } to trigger the email.
//
// To activate: set WEEKLY_SUMMARY_CRON_SECRET in Vercel env vars and add
// the cron entry in vercel.json pointing at this route.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createServiceSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brytthrive.com';

type ChildSummary = {
  name: string;
  missions_completed: number;
  streak: number;
  top_categories: string[];
  coins_earned: number;
};

function buildSummaryHtml(parentEmail: string, summaryText: string, children: ChildSummary[]): string {
  const dashboardUrl = `${SITE_URL}/dashboard`;

  const childRows = children.map((c) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${c.name}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">
          ${c.missions_completed} missions · ${c.streak > 0 ? `🔥 ${c.streak}-day streak · ` : ''}🪙 ${c.coins_earned} coins earned
        </p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your BrytThrive Weekly Summary</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#14B8A6 0%,#0F766E 100%);padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Your Weekly Win Report 🏆</p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">BrytThrive · Week ending ${new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">${summaryText.replace(/\n/g, '<br/>')}</p>

              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">This week by the numbers</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                ${childRows}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#14B8A6;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:50px;">
                      View dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                BrytThrive · You&rsquo;re receiving this because you signed up with ${parentEmail}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// POST /api/weekly-summary
// Body: { parent_id: string, dry_run?: boolean }
// Auth: WEEKLY_SUMMARY_CRON_SECRET header (for cron) OR authenticated session.
export async function POST(req: NextRequest) {
  // Cron secret auth (server-to-server)
  const cronSecret = process.env.WEEKLY_SUMMARY_CRON_SECRET;
  const providedSecret = req.headers.get('x-cron-secret');
  const isAuthorizedCron = cronSecret && providedSecret === cronSecret;

  if (!isAuthorizedCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { parent_id?: string; dry_run?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { parent_id, dry_run = true } = body;
  if (!parent_id) {
    return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
  }

  const serviceSupabase = createServiceSupabaseClient();

  // Fetch parent email
  const { data: { user: parentUser }, error: userErr } = await serviceSupabase.auth.admin.getUserById(parent_id);
  if (userErr || !parentUser?.email) {
    console.error('[weekly-summary] parent lookup failed:', userErr?.message);
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  }

  // Fetch children
  const { data: children, error: childErr } = await serviceSupabase
    .from('children')
    .select('id, name, points, streak')
    .eq('parent_id', parent_id);

  if (childErr || !children?.length) {
    return NextResponse.json({ skipped: true, reason: 'No children found' });
  }

  // Fetch this week's missions (last 7 days)
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().split('T')[0];

  const childIds = children.map((c) => c.id);
  const { data: missions } = await serviceSupabase
    .from('missions')
    .select('child_id, category, is_completed, screen_time_reward')
    .in('child_id', childIds)
    .gte('mission_date', sinceStr);

  const childSummaries: ChildSummary[] = children.map((child) => {
    const childMissions = (missions ?? []).filter((m) => m.child_id === child.id);
    const completed = childMissions.filter((m) => m.is_completed);
    const catCounts: Record<string, number> = {};
    for (const m of completed) {
      const cat = m.category ?? 'general';
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
    const topCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
    const coinsEarned = completed.reduce((sum, m) => sum + (m.screen_time_reward ?? 5), 0);

    return {
      name: child.name,
      missions_completed: completed.length,
      streak: child.streak ?? 0,
      top_categories: topCategories,
      coins_earned: coinsEarned,
    };
  });

  // Generate AI narrative
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let summaryText = '';
  try {
    const totalCompleted = childSummaries.reduce((s, c) => s + c.missions_completed, 0);
    const prompt = `Write a warm, encouraging 2-sentence weekly summary for a parent whose ${children.length === 1 ? 'child' : `${children.length} children`} completed ${totalCompleted} missions this week. Highlight effort and growth. Do not mention the app by name. Keep it under 60 words.`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    summaryText = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
  } catch (err) {
    console.error('[weekly-summary] Claude narrative failed:', err);
    summaryText = `Your family had a great week! Keep the momentum going — every mission completed is a step toward stronger habits.`;
  }

  if (dry_run) {
    return NextResponse.json({ dry_run: true, to: parentUser.email, summaryText, children: childSummaries });
  }

  // Send via Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not set' });
  }

  const resend = new Resend(apiKey);
  const html = buildSummaryHtml(parentUser.email, summaryText, childSummaries);
  const { error: sendErr } = await resend.emails.send({
    from: 'Wayne at BrytThrive <notifications@resend.dev>',
    to: parentUser.email,
    subject: `Your family's week in review 🏆`,
    html,
  });

  if (sendErr) {
    console.error('[weekly-summary] Resend error:', sendErr);
    return NextResponse.json({ error: String(sendErr) }, { status: 500 });
  }

  return NextResponse.json({ sent: true, to: parentUser.email });
}
