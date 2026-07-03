# Deploying Philip Content HQ to Vercel

The repo doubles as a web platform: a private content-generation app that drafts in PB's voice using the Claude API, with access limited to two email addresses.

## What you need before starting

1. **Anthropic API key** — create one at [platform.claude.com](https://platform.claude.com) → API Keys.
2. **An auth secret** — run `openssl rand -base64 32` (or any long random string).
3. **A shared password** — anything long that both users will type to sign in.

No email service is needed. Sign-in is by allowed email + a shared password.

## Deploy steps

1. Go to [vercel.com/new](https://vercel.com/new) and import the `reupskill/Philip-Content-HQ` GitHub repository. Vercel auto-detects Next.js; no build settings need changing.
2. Before clicking Deploy, add these Environment Variables:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Claude API key |
   | `ALLOWED_EMAILS` | `philipbabs29@gmail.com,ceocontent@uvest.team` |
   | `LOGIN_PASSWORD` | the shared password both users will type |
   | `AUTH_SECRET` | the random secret you generated |

3. Click **Deploy**. That's it — visit the deployment URL, sign in with an allowed email + the shared password, and start generating.

## How access control works

- To sign in you need **both** an email in `ALLOWED_EMAILS` **and** the `LOGIN_PASSWORD`. Anyone missing either gets a single generic "Incorrect email or password" message.
- A successful sign-in sets a signed session cookie that lasts 30 days (httpOnly).
- Removing an email from `ALLOWED_EMAILS` (and redeploying) revokes that person immediately — sessions are re-checked against the allowlist on every request.
- To rotate access for everyone, change `LOGIN_PASSWORD` and redeploy.
- All pages and APIs are protected by middleware; only `/login` and the login endpoint are public.

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
