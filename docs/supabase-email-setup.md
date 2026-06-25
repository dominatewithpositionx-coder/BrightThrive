# BrytThrive — Supabase Branded Email Setup

This guide covers how to replace the default "Supabase Auth" confirmation email
with a fully BrytThrive-branded experience.

---

## Step 1 — Verify your sending domain in Resend

Before Supabase can send email from `notifications@brytthrive.com`, the domain
must be verified by your SMTP provider (Resend).

1. Go to [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Enter `brytthrive.com`
3. Resend will give you DNS records to add. Add all of them in your DNS provider
   (Namecheap, Cloudflare, GoDaddy, etc.):

| Type | Name | Value |
|------|------|-------|
| TXT  | `resend._domainkey.brytthrive.com` | (DKIM key provided by Resend) |
| TXT  | `brytthrive.com` | `v=spf1 include:amazonses.com ~all` *(may vary)* |
| MX   | *(if required)* | *(as shown by Resend)* |

4. Click **Verify** in Resend. DNS propagation can take up to 48 hours but is
   usually under 10 minutes.
5. Once verified, Resend will confirm the domain is active. You can now send
   from any `@brytthrive.com` address.

> **Note:** Get your Resend API key from Resend Dashboard → **API Keys** →
> **Create API Key**. Store it as `RESEND_API_KEY` in Vercel environment variables.

---

## Step 2 — Configure custom SMTP in Supabase

**Supabase Dashboard → Project Settings → Authentication → SMTP Settings**

| Field | Value |
|-------|-------|
| Enable custom SMTP | ✅ On |
| Sender name | `BrytThrive` |
| Sender email | `notifications@brytthrive.com` |
| SMTP host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *(your Resend API key)* |

Click **Save**.

> From this point all Supabase auth emails (confirm signup, magic link, password
> reset) will appear as **"BrytThrive" <notifications@brytthrive.com>** in the
> recipient's inbox.

---

## Step 3 — Set the email template

**Supabase Dashboard → Authentication → Email Templates → Confirm signup**

1. Set the **Subject** field to:
   ```
   Confirm your BrytThrive account
   ```

2. Delete the existing template body entirely.

3. Open the file `emails/confirm-signup.html` from this repo and copy its full
   contents.

4. Paste it into the **Body** field in Supabase.

5. **Critical:** Verify that `{{ .ConfirmationURL }}` appears in two places in
   the pasted HTML — once in the button `href` and once in the plaintext
   fallback. Do not alter this variable; Supabase replaces it with the real
   confirmation link at send time.

6. Click **Save**.

### What the template includes

- BrytThrive logo + green→teal→blue gradient header bar
- Tagline: *Turn screen time into growth time*
- Welcome headline with friendly sub-copy
- Prominent **Confirm my email address →** CTA button
- Feature bullets:
  - Create child profiles
  - Generate daily AI missions
  - Track mood check-ins
  - Reward healthy screen-time habits
- Plaintext URL fallback (required for spam-filter compliance)
- Branded footer with tagline

---

## Step 4 — Test the flow end-to-end

1. In Supabase Dashboard → Authentication → Email Templates → click **Preview**
   to see a rendered version.
2. Sign up with a real email address on `brytthrive.com/onboarding`.
3. Check your inbox — you should receive email **from** `notifications@brytthrive.com`
   with subject `Confirm your BrytThrive account`.
4. Click the confirmation link and confirm it lands on your app (not a Supabase
   default page). If redirected to a Supabase page, check:
   - `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel
   - Supabase → Authentication → URL Configuration → **Site URL** = `https://brytthrive.com`
   - **Redirect URLs** includes `https://brytthrive.com/**`

---

## Other auth email templates (optional)

Apply the same branding approach to these templates in the Supabase dashboard:

| Template | Subject suggestion |
|----------|--------------------|
| Magic Link | `Your BrytThrive login link` |
| Change Email Address | `Confirm your new BrytThrive email` |
| Reset Password | `Reset your BrytThrive password` |

Reference `emails/brainthrive-template.html` as a base layout for these.

---

## Checklist

- [ ] `brytthrive.com` verified in Resend
- [ ] DNS records added and propagated
- [ ] Supabase custom SMTP configured with Resend credentials
- [ ] Confirm signup subject set to `Confirm your BrytThrive account`
- [ ] HTML from `emails/confirm-signup.html` pasted into Supabase template
- [ ] `{{ .ConfirmationURL }}` present in both button and fallback text
- [ ] End-to-end test email received from `notifications@brytthrive.com`
- [ ] Confirmation link redirects to BrytThrive app (not Supabase default)
