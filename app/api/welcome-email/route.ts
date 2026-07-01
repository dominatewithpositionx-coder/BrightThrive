import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brytthrive.com';

function buildHtml(parentEmail: string): string {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const onboardingUrl = `${SITE_URL}/onboarding`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to BrytThrive!</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#14B8A6 0%,#0F766E 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">BrytThrive 💛</p>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Positive Behavior Technology for families</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#0f172a;">
                Hi there 👋
              </p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">
                I&rsquo;m Wayne — founder of BrytThrive and a dad of three. I built this because I was tired of the
                daily screen-time battle in my own home.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#334155;">
                BrytThrive isn&rsquo;t about taking screens away. It&rsquo;s about giving your kids a reason to earn them —
                through habits, kindness, movement, and learning that actually matter.
              </p>

              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f172a;">Here&rsquo;s what to do next:</p>

              <!-- Checklist -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                ${[
                  ['1', '🧒', 'Add your child', 'Head to the dashboard and tap "Add child" to get started.'],
                  ['2', '🎯', 'Set their first missions', 'BrytThrive will generate 5 personalized missions based on mood and weather.'],
                  ['3', '⭐', 'Set a reward', 'Choose what they&rsquo;re earning toward — screen time, a treat, or anything that motivates them.'],
                  ['4', '😊', 'Start the first mood check-in', 'Hand them your phone and let them tap how they&rsquo;re feeling. That&rsquo;s it.'],
                ].map(([_n, emoji, title, desc]) => `
                <tr>
                  <td style="padding:10px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:20px;">${emoji}</span>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${title}</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a
                      href="${dashboardUrl}"
                      style="display:inline-block;background:#14B8A6;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:50px;box-shadow:0 2px 8px rgba(20,184,166,0.35);"
                    >
                      Go to my dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Reassurance -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDFA;border-radius:12px;margin:0 0 28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#0F766E;">
                      <strong>No pressure.</strong> BrytThrive works at your pace. Even one mission a day is a win.
                      Your family doesn&rsquo;t have to be perfect — just a little bit better, one day at a time.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#334155;">
                If you ever have a question, just reply to this email. I read every one.
              </p>

              <p style="margin:0 0 4px;font-size:15px;color:#334155;">Here for you,</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">Wayne</p>
              <p style="margin:0;font-size:13px;color:#94a3b8;">Founder, BrytThrive · Dad of three</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                BrytThrive · 🇨🇦 Data stored in Canada · No ads · No tracking
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                You&rsquo;re receiving this because you created an account with ${parentEmail}.
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

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Resend not configured — return success so signup is never blocked
    return NextResponse.json({ success: true, skipped: true });
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: 'Wayne at BrytThrive <notifications@resend.dev>',
      to: email,
      subject: 'Welcome to BrytThrive! Here\'s what happens next 💛',
      html: buildHtml(email),
    });

    if (error) {
      console.error('[welcome-email] Resend error:', error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[welcome-email] threw:', err);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
