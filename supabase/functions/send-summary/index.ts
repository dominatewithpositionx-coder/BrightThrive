import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  const { data: summaries, error } = await supabase
    .from("weekly_summaries_log")
    .select("*")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) console.error("Fetch summaries error:", error);

  for (const s of summaries ?? []) {
    const html = `
      <div style="font-family:sans-serif">
        <h2>Your Weekly BrytThrive Summary</h2>
        <p>${s.summary_html}</p>
        <hr>
        <p style="font-size:12px;color:#777">
          © ${new Date().getFullYear()} BrytThrive — Earn your play. Enjoy your day.
        </p>
      </div>`;

    await resend.emails.send({
      from: "BrytThrive <notifications@resend.dev>",
      to: s.parent_email,
      subject: "Your Weekly BrytThrive Summary 🏆",
      html,
    });
  }

  return new Response("Weekly summaries sent.", { status: 200 });
});
