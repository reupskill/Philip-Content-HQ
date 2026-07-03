# Deploying Philip Content HQ to Vercel

The repo doubles as a web platform: a private content-generation app that drafts in PB's voice using the Claude API, with access limited to two email addresses.

## What you need before starting

1. **Anthropic API key** — create one at [platform.claude.com](https://platform.claude.com) → API Keys.
2. **Resend account** (free) — create one at [resend.com](https://resend.com) → API Keys. This sends the sign-in emails.
   - Important: Resend's default sender (`onboarding@resend.dev`) can only deliver to the email address that owns the Resend account. To let **both** allowed users sign in, verify a domain in Resend (Domains → Add Domain) and set `EMAIL_FROM` to an address on it, e.g. `Philip Content HQ <hq@uvest.ng>`.
3. **An auth secret** — run `openssl rand -base64 32` (or any long random string).

## Deploy steps

1. Go to [vercel.com/new](https://vercel.com/new) and import the `reupskill/Philip-Content-HQ` GitHub repository. Vercel auto-detects Next.js; no build settings need changing.
2. Before clicking Deploy, add these Environment Variables:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Claude API key |
   | `ALLOWED_EMAILS` | the two allowed emails, comma-separated, e.g. `adeneyos@gmail.com,philip@uvest.ng` |
   | `AUTH_SECRET` | the random secret you generated |
   | `RESEND_API_KEY` | your Resend API key |
   | `EMAIL_FROM` | (after domain verification) e.g. `Philip Content HQ <hq@uvest.ng>` |

3. Click **Deploy**. That's it — visit the deployment URL, enter an allowed email, click the link in the inbox, and start generating.

## How access control works

- Only emails in `ALLOWED_EMAILS` receive sign-in links; anyone else gets a generic "if that email has access…" message (no way to probe the list).
- Sign-in links are signed tokens that expire in 15 minutes; sessions last 30 days in an httpOnly cookie.
- Removing an email from `ALLOWED_EMAILS` (and redeploying) revokes that person's access immediately — sessions are re-checked against the allowlist on every request.
- All pages and APIs are protected by middleware; only `/login` and the two auth endpoints are public.

## How generation works

- `POST /api/generate` assembles a system prompt from `knowledge-base/`, `hooks-bank.md`, and `templates/` — the same files the repo's editorial workflow uses. Update those files, push, and the deployed engine picks up the new knowledge on the next deploy.
- Model: `claude-opus-4-8` with adaptive thinking, streamed to the browser as it writes.
- The knowledge-base system prompt is sent with `cache_control: ephemeral`, so Anthropic's prompt cache serves the large stable prefix at ~10% of input cost on repeat generations within the cache window.
- Drafts are kept in each user's browser (localStorage, last 30) — nothing is stored server-side.

## Cost expectations

The knowledge base is ~15–20K tokens. At Claude Opus 4.8 pricing ($5 / $25 per MTok), a typical generation costs a few cents — less when the prompt cache is warm. Two users generating daily will land in the tens-of-dollars-per-month range at most.

## Local development

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
```
