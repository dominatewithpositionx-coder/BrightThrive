// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, name } = await req.json();
    const recipient = email || process.env.NOTIFY_EMAIL;

    if (!recipient) {
      return NextResponse.json({ error: 'No recipient email provided.' }, { status: 400 });
    }

    // ✅ Locate BrainThrive HTML template
    const templatePath = path.join(process.cwd(), 'emails', 'BrainThrive-template.html');
    let emailHtml: string;

    try {
      emailHtml = fs.readFileSync(templatePath, 'utf8');
    } catch {
      console.warn('⚠️ Missing BrainThrive-template.html — using fallback inline template.');
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              body { font-family: Arial, sans-serif; background-color: #f9fafb; color: #111; margin: 0; padding: 20px; }
              .container { background: white; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
              .logo { text-align: center; margin-bottom: 20px; }
              .cta { background-color: #00e08a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 24px; }
              .footer { font-size: 12px; color: #555; text-align: center; margin-top: 32px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="https://brainthrive.vercel.app/brand/brainthrive/logo.png" alt="BrainThrive" width="150" />
              </div>
              <h1>Welcome to <strong>BrainThrive</strong>!</h1>
              <p>Hey ${name || 'Friend'},</p>
              <p>Thanks for joining our waitlist. You're helping us empower smarter play and balanced focus!</p>
              <a href="https://brainthrive.vercel.app" class="cta">Visit BrainThrive</a>
              <div class="footer">
                © ${new Date().getFullYear()} BrainThrive — Empowering Smarter Play and Focus.
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // ✅ Send email via Resend
    const { error } = await resend.emails.send({
      from: 'BrainThrive <notifications@resend.dev>',
      to: recipient,
      subject: `Welcome to BrainThrive${name ? `, ${name}` : ''}! 🎉`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`📧 Test email successfully sent to ${recipient}`);
    return NextResponse.json({ success: true, message: `Email sent to ${recipient}` });
  } catch (err: any) {
    console.error('❌ Error sending test email:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
