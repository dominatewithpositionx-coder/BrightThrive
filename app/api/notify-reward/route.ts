import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const { childName, rewardTitle, cost, pointsRemaining, parentEmail, parentId } = await req.json();

    if (!childName || !rewardTitle || !cost || !parentEmail) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Check notification prefs from family_plans.personalization_data
    let rewardNotificationsEnabled = false;
    if (parentId) {
      const { data: plan } = await supabase
        .from('family_plans')
        .select('personalization_data')
        .eq('parent_id', parentId)
        .single();
      const pd = (plan?.personalization_data ?? {}) as Record<string, unknown>;
      rewardNotificationsEnabled = Boolean(pd.reward_notifications);
    }

    if (!rewardNotificationsEnabled) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const templatePath = path.join(process.cwd(), 'emails', 'reward-redeemed.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf8');

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://brightthrive.com'}/dashboard`;

    emailHtml = emailHtml
      .replace(/{{childName}}/g, childName)
      .replace(/{{rewardTitle}}/g, rewardTitle)
      .replace(/{{cost}}/g, String(cost))
      .replace(/{{pointsRemaining}}/g, String(pointsRemaining))
      .replace(/{{dashboardUrl}}/g, dashboardUrl)
      .replace(/{{year}}/g, new Date().getFullYear().toString());

    await resend.emails.send({
      from: 'BrightThrive <notifications@resend.dev>',
      to: parentEmail,
      subject: `🎁 ${childName} redeemed ${rewardTitle}!`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending reward email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
