# Deploying Philip Content HQ to Vercel

A full-stack AI content platform for Dr. Philip Adenle, CEO of Uvest. Six dedicated content generators, persistent content bank, training voice library, and a 30-day calendar — all powered by Claude and backed by Supabase.

## What you need before starting

1. **Anthropic API key** — create one at [platform.claude.com](https://platform.claude.com) → API Keys.
2. **Supabase project** — create a free project at [supabase.com](https://supabase.com).
3. **An auth secret** — run `openssl rand -base64 32` (or any long random string).
4. **A shared password** — anything long that both users will type to sign in.

No email service is needed. Sign-in is by allowed email + shared password.

---

## Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, open **SQL Editor → New query** and paste the contents of `supabase-schema.sql` from this repo. Run it.
3. Copy your credentials from **Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret** → `SUPABASE_SERVICE_KEY` (use the secret key, not the anon key)

---

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the `reupskill/Philip-Content-HQ` GitHub repository. Vercel auto-detects Next.js; no build settings need changing.
2. Before clicking Deploy, add these Environment Variables:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Claude API key |
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_KEY` | your Supabase service_role secret |
   | `ALLOWED_EMAILS` | `philipbabs29@gmail.com,ceocontent@uvest.team` |
   | `LOGIN_PASSWORD` | the shared password both users will type |
   | `AUTH_SECRET` | the random secret you generated |

3. Click **Deploy**. Visit the deployment URL, sign in, and start generating.

### Optional

| Name | Value |
|---|---|
| `CLAUDE_MODEL` | Override the model (default: `claude-sonnet-4-6`) |

---

## How access control works

- Sign in requires **both** an email in `ALLOWED_EMAILS` **and** the `LOGIN_PASSWORD`.
- A successful sign-in sets a signed session cookie that lasts 30 days (httpOnly).
- Removing an email from `ALLOWED_EMAILS` and redeploying revokes that person immediately.
- To rotate access for everyone, change `LOGIN_PASSWORD` and redeploy.

---

## The six generators

| Generator | Platform | Output |
|---|---|---|
| Video Script | `/video` | Hook, Story, Insight, Close, Caption, B-roll, Filming notes |
| LinkedIn Post | `/linkedin` | 1–3 variations: Narrative, Data-backed, Philosophical |
| X / Twitter | `/x` | One-liner, 3-Tweet Thread, 5-Tweet Thread, Founder Lesson, Growth Lesson |
| Substack Essay | `/substack` | Full essay streamed via SSE, with Teaser section |
| Content River | `/content-river` | 36+ derivatives from any existing content |
| Daily Brief | `/daily-brief` | Today's conviction, 5 market examples, newsletter draft |

---

## Supporting features

- **Content Bank** (`/content-bank`) — everything generated, filterable by platform, expandable
- **Training Voice Library** (`/training`) — pieces Dr. Philip has approved as voice examples
- **Content Calendar** (`/calendar`) — AI-generated 30-day posting plan, list and grid views
- **Platform Switcher** — persistent bar on every generator that carries your idea across platforms via `?idea=` param

---

## How generation works

- All Claude calls run server-side (API routes). The API key is never exposed to the browser.
- Model: `claude-sonnet-4-6` by default (override with `CLAUDE_MODEL`).
- Substack essays stream via Server-Sent Events; all other generators return JSON.
- All content is saved to Supabase before being returned to the client.
- System prompts are cached module-level so Anthropic's prompt cache gets repeated hits.

---

## Cost expectations

At `claude-sonnet-4-6` pricing, a typical generation costs well under $0.01. Two users generating several pieces per day will stay in the single digits per month.

---

## Local development

```bash
cp .env.example .env.local   # fill in all values
npm install
npm run dev                  # http://localhost:3000
```
