import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email } = await req.json();

    await resend.emails.send({
      from: "BrightThrive <notifications@resend.dev>",
      to: process.env.NOTIFY_EMAIL!,
      subject: "🎉 New BrightThrive Waitlist Signup",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color:#111827;">New Waitlist Signup</h2>
          <p><b>Name:</b> ${name || "N/A"}</p>
          <p><b>Email:</b> ${email}</p>
          <p>🔥 Someone just joined the BrightThrive waitlist!</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
