# Philip Content HQ

The content headquarters for **Dr. Philip Babalola (PB)** — founder & CEO of Uvest, Nigerian real estate developer, and the voice behind *PB on Real Estate* on Substack.

This repo turns his documented point of view into founder-led content: LinkedIn posts, X threads, Substack essays, newsletters, video scripts, Instagram carousels, and realtor training material — all in his authentic voice, all traceable to things he actually said, did, and built.

It works two ways:

1. **A private web platform** (Next.js, deployable to Vercel) — sign in with one of two allowed emails, pick a platform and topic, and the Claude API drafts in PB's voice, streamed live. See [`DEPLOYMENT.md`](./DEPLOYMENT.md).
2. **Claude Code slash commands** — open the repo in Claude Code and use `/linkedin`, `/substack`, `/content-week`, etc.

Both are driven by the same knowledge base, so updating the markdown files updates everything.

## How it works

```
knowledge-base/   ← the single source of truth (his POVs, stories, voice, data)
templates/        ← platform-specific structures with his rules baked in
hooks-bank.md     ← ready-to-use opening lines from his own intake
content/          ← drafts and finished pieces, one folder per platform
calendar/         ← the rolling content calendar
.claude/commands/ ← slash commands that generate content in his voice
CLAUDE.md         ← operating instructions for Claude (the content team's brain)
app/, lib/        ← the Next.js web platform (auth + Claude generation API)
DEPLOYMENT.md     ← how to deploy the platform to Vercel
```

## Quick start (with Claude Code)

Open this repo in Claude Code and use the slash commands:

| Command | What it does |
|---|---|
| `/linkedin [topic]` | Draft a LinkedIn post in PB's voice |
| `/x-post [topic] [--thread]` | One-liners or a full thread |
| `/substack [topic]` | Deep, data-backed essay for *PB on Real Estate* |
| `/video [topic] [--long]` | Short-form or long-form video script |
| `/instagram [topic]` | Carousel, story post, or quote card |
| `/newsletter [topic]` | A newsletter edition |
| `/content-week [theme]` | Plan + draft a full week across platforms |
| `/intake [new material]` | Feed a new PB questionnaire into the knowledge base |

## The rules that keep it authentic

1. **Nothing is invented.** Every fact, story, number, and opinion traces to `knowledge-base/`, which is built from PB's own intake questionnaire. Gaps get flagged `[NEEDS PB INPUT]`, never filled with guesses.
2. **The voice is non-negotiable.** Honest, reflective, practical, slightly philosophical, direct. No motivational fluff, no generic real estate content, no corporate polish. See `knowledge-base/02-voice-and-tone.md`.
3. **Education before selling.** "Education creates trust." Every piece delivers standalone value first.
4. **His words stay his.** Signature phrases (`knowledge-base/05-signature-phrases.md`) are used verbatim, never smoothed out.

## Keeping it alive

The knowledge base grows through intake: each time PB completes a questionnaire, records a voice note, or gives an interview, run `/intake` on the material. New POVs, stories, and phrases get merged in, and the content engine gets sharper.

Launch-week drafts are already in `content/` and scheduled in `calendar/content-calendar.md`.
