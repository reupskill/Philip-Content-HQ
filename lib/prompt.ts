import fs from "fs";
import path from "path";

// The system prompt must be byte-identical across requests so Anthropic's
// prompt cache gets a hit (prefix match). Assemble it deterministically:
// fixed file order, no timestamps, no per-request values. Anything that
// varies (platform, topic, notes) belongs in the user message instead.

let cachedSystemPrompt: string | null = null;

function readIfExists(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function buildSystemPrompt(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  const root = process.cwd();
  const kbDir = path.join(root, "knowledge-base");
  const templatesDir = path.join(root, "templates");

  const kbFiles = fs
    .readdirSync(kbDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const templateFiles = fs
    .readdirSync(templatesDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const sections: string[] = [];

  sections.push(`You are the content engine for Dr. Philip Babalola ("PB"), founder and CEO of Uvest, a Nigerian real estate development company. You write founder-led content in his authentic voice for LinkedIn, X/Twitter, Substack, newsletters, video scripts, Instagram, and realtor training material.

THE ONE RULE THAT GOVERNS EVERYTHING:
Never invent facts, stories, numbers, or opinions for Dr. Philip. Every claim must trace back to the knowledge base below. If a piece needs a fact or story that is not documented, write [NEEDS PB INPUT: question] in its place instead of making it up. His credibility is the product.

OUTPUT RULES:
- Produce the content piece itself, ready to review and publish. No meta-commentary, no "Here's a draft", no explanations before or after — unless the user explicitly asks for options or analysis.
- Follow the platform template that matches the requested platform.
- Use his signature phrases verbatim where they fit. Never paraphrase them into something smoother.
- Numbers and statistics only from the knowledge base. No invented data.
- The tone is a mentor who respects your intelligence enough to tell you the truth: honest, reflective, practical, strategic, slightly philosophical, clear and direct. Never motivational fluff, never generic real estate content, never corporate polish.
- Nigerian context is the default: naira, C of O, Governor's Consent, Lagos/Ibadan geography, NYSC.
- End with his CTA pattern where appropriate: follow the page → subscribe to "PB on Real Estate" on Substack → one concrete learning step → make the first decision.`);

  sections.push("\n\n=== KNOWLEDGE BASE (single source of truth) ===\n");
  for (const file of kbFiles) {
    sections.push(`\n--- ${file} ---\n${readIfExists(path.join(kbDir, file))}`);
  }

  sections.push("\n\n=== HOOKS BANK ===\n");
  sections.push(readIfExists(path.join(root, "hooks-bank.md")));

  sections.push("\n\n=== PLATFORM TEMPLATES ===\n");
  for (const file of templateFiles) {
    sections.push(`\n--- ${file} ---\n${readIfExists(path.join(templatesDir, file))}`);
  }

  cachedSystemPrompt = sections.join("\n");
  return cachedSystemPrompt;
}

export const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn post", template: "linkedin-post.md" },
  { id: "x", label: "X / Twitter", template: "x-post.md" },
  { id: "substack", label: "Substack essay", template: "substack-essay.md" },
  { id: "newsletter", label: "Newsletter edition", template: "newsletter.md" },
  { id: "video", label: "Video script", template: "video-script.md" },
  { id: "instagram", label: "Instagram (carousel / quote / story)", template: "instagram.md" },
  { id: "realtor-training", label: "Realtor training content", template: "realtor-training.md" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export function buildUserMessage(input: {
  platform: string;
  topic: string;
  pillar?: string;
  notes?: string;
}): string {
  const platform = PLATFORMS.find((p) => p.id === input.platform);
  const lines = [
    `Create content for this platform: ${platform ? platform.label : input.platform}.`,
    `Follow the "${platform ? platform.template : "matching"}" template from the PLATFORM TEMPLATES section.`,
    `Topic / angle: ${input.topic}`,
  ];
  if (input.pillar) lines.push(`Content pillar: ${input.pillar}`);
  if (input.notes) lines.push(`Additional direction from the team: ${input.notes}`);
  lines.push(
    "Write the piece now, in Dr. Philip's voice, anchored in the knowledge base. Output only the content piece."
  );
  return lines.join("\n");
}
