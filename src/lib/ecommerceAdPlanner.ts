import { generateText } from "@/lib/ai";

/**
 * The ad planner.
 * Takes the user's business + product + chosen actor, returns a structured plan:
 *   - Hook (the spoken opening line)
 *   - Scene-by-scene direction (visual prompt + spoken line per scene)
 *   - Headline / body / CTA / hashtags
 *   - Music recommendation
 */

export type EcommerceAdPlan = {
  headline: string;
  bodyText: string;
  callToAction: string;
  hashtags: string[];
  fullScript: string;       // Complete spoken script (read straight through)
  scenes: PlannedScene[];
  musicGenre: string;
  musicMood: string;
  predictedScore: number;
  scoreReasoning: string;
};

export type PlannedScene = {
  sceneNumber: number;
  durationSeconds: number;
  spokenLine: string;        // What the actor says during this scene
  visualPrompt: string;      // Detailed scene direction for Kling
  shotType: string;          // "close-up", "medium shot", "over-the-shoulder", etc.
  emotion: string;           // "excited", "curious", "satisfied"
};

export type AdPlanInput = {
  businessName?: string;
  businessDescription?: string;
  productName: string;
  productOffer?: string;
  productDescription?: string;
  productImageCount: number;
  actorName: string;
  actorVibe: string;
  actorSetting: string;
  language: string;
  targetSeconds: number;     // Total ad length (15, 30, 60)
  brandVoice?: string;       // From Brand Kit
  targetAudience?: string;   // From Brand Kit
};

const PLANNER_SYSTEM_PROMPT = `You are the world's #1 short-form UGC ad director. You've made 10,000+ ads that converted 5–10× the average. Brands like Manifest, RYZE, Magic Mind, and AG1 routinely buy your scripts. Your job: design ONE complete UGC video ad — script + scene-by-scene direction — that an AI image+video model (Nano Banana for stills, Kling 2.6 Pro for clips) will execute literally. Whatever you write IS what gets generated. No human will fix your sloppy work.

═══ NON-NEGOTIABLE RULES ═══

1. HOOK OWNS THE FIRST 1.5 SECONDS. Writing "Hey guys, today I'm going to talk about…" gets you fired. Open with one of:
   • Pattern interrupt: "Wait — STOP putting [thing] on your [body part]."
   • Result tease: "Day 14 of using this and my [skin/sleep/energy] is unrecognizable."
   • Confession: "Okay this is embarrassing but I've been doing X wrong my whole life."
   • Specific stat: "I tried 12 [category] before this one and only this fixed [problem]."
   • Negative claim: "Don't buy [popular alt]. Here's why."
   • Visual surprise: an action that makes the viewer pause.

2. ONE BIG IDEA. Pick the strongest single benefit. Cut everything else. "Three benefits" = zero benefits. If the ad needs to teach 5 things, it's not an ad, it's a manual.

3. WRITE LIKE A HUMAN TEXTING A FRIEND. Real speech has:
   • Sentence fragments. ("Wild.")
   • Filler ("honestly", "like", "okay so", "I'm not even kidding").
   • Interrupted thoughts ("I was about to say — wait, look at this.")
   • Specific numbers ("12 days", "$47", "3am") — never round/vague.
   • Personal opinion, not corporate adjectives. ("This is dumb good" > "high-quality product").
   NEVER use: "elevate", "unlock", "discover", "transform", "journey", "experience", "introducing", "premium", "innovative", "next-level". These scream AI.

4. EVERY SCENE MUST EARN ITS SECONDS. If a scene doesn't:
   (a) advance the story, OR
   (b) demonstrate the product in use/result,
   delete it. Repeating "actor smiles at product" twice is a fail.

5. SOFT CTA. Not "Buy now". Try: "Link in bio if you want to try it.", "Promo code is in the description.", "Don't say I didn't warn you.", "Ours is linked below.", "If your [problem] sounds like mine, you'll get it."

═══ SCENE PROMPT RULES (these get sent verbatim to Kling 2.6 Pro for IMAGE-TO-VIDEO) ═══

A Kling prompt is NOT a static description. It is a 5-second motion script. Format every visualPrompt as:

   [SHOT TYPE], [actor + appearance + outfit + expression], [specific physical action they perform across the 5s], [product placement / interaction], [environment + lighting], [camera movement].

✅ GOOD: "Medium handheld shot. A 28-year-old Black woman with cropped natural hair, wearing an oversized cream sweater, leans toward camera, eyes widening as she pulls a small amber serum bottle out of frame and tilts it side-to-side at her cheek. Soft morning window light from camera-left, warm tones. Camera slowly pushes in 6 inches over 5 seconds."

❌ BAD: "A woman uses the serum. Beautiful lighting. Product hero shot."

Required in EVERY visualPrompt:
   • SHOT TYPE explicitly named (close-up, medium shot, wide, over-the-shoulder, low-angle, POV).
   • CAMERA MOVE explicitly named (static, slow push-in, slow pull-back, handheld follow, whip-pan, tilt-up, dolly-left). If unsure, use "static handheld".
   • LIGHTING described with direction + temperature (e.g. "soft window light from camera-left, warm 4000K", "harsh midday sun overhead", "neon backlight rim, cool 6500K").
   • The actor's PHYSICAL ACTION across the 5 seconds, in present tense. Motion drives Kling output.
   • The PRODUCT visible and interacted with — held, applied, opened, poured, worn — never sitting on a shelf untouched.

NEVER include in visualPrompt:
   • Text overlays, logos, captions, "Sale!" stickers, UI buttons.
   • The dialog/spoken line (that's spokenLine's job).
   • Words like "cinematic", "beautiful", "stunning", "high quality" (Kling ignores them; eats your token budget).
   • References to other scenes ("the same actor as before") — each prompt is standalone.

═══ STRUCTURE ═══

Each scene gets:
   • spokenLine in the output language ({langName}). Match the rhythm of natural speech (~2.5 words/second).
   • visualPrompt in English (Kling expects English).
   • durationSeconds: ${"${secondsPerScene}"} unless a scene's beat clearly needs the alternate (5s for fast cuts, 10s for a slow reveal).

═══ OUTPUT ═══

Valid JSON only. No markdown fences. No commentary. JSON keys stay English; spoken text stays in the requested output language.`;

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  it: "Italian", hi: "Hindi", ar: "Arabic", ja: "Japanese", zh: "Chinese",
  sw: "Swahili", yo: "Yoruba", ko: "Korean",
};

/**
 * Decide how many scenes an ad of `targetSeconds` should have, and how long each.
 * Kling tops out at 10s per clip — so anything ≤10s is a single shot.
 */
export function computeSceneSchedule(targetSeconds: number): { sceneCount: number; secondsPerScene: number } {
  if (targetSeconds <= 10) return { sceneCount: 1, secondsPerScene: targetSeconds <= 5 ? 5 : 10 };
  const sceneCount = Math.max(2, Math.min(6, Math.round(targetSeconds / 6)));
  const secondsPerScene = Math.round(targetSeconds / sceneCount);
  return { sceneCount, secondsPerScene };
}

export async function planEcommerceAd(input: AdPlanInput): Promise<EcommerceAdPlan> {
  const langName = LANG_NAMES[input.language] ?? "English";

  const { sceneCount, secondsPerScene } = computeSceneSchedule(input.targetSeconds);

  const systemPrompt = PLANNER_SYSTEM_PROMPT
    .replace("{langName}", langName)
    .replace("${secondsPerScene}", String(secondsPerScene));

  const userPrompt = `Create one complete UGC ad. Output spoken text in ${langName}.

BRAND CONTEXT:
- Business: ${input.businessName ?? "(not provided)"}
- What they do: ${input.businessDescription ?? "(not provided)"}
- Brand voice: ${input.brandVoice ?? "natural, conversational, like a friend"}
- Target audience: ${input.targetAudience ?? "(infer from product)"}

PRODUCT:
- Name: "${input.productName}"
- What it is / who it's for: ${input.productDescription ?? "(use product name to infer)"}
- Offer: ${input.productOffer ?? "(none — don't invent one)"}
- Product images uploaded: ${input.productImageCount} (composite will use them; reference the product naturally)

ACTOR:
- Name (for your reference only — NEVER include in the script): ${input.actorName}
- Vibe: ${input.actorVibe}
- Setting they'll appear in: ${input.actorSetting}

LENGTH:
- Total: ~${input.targetSeconds} seconds
- Scenes: ${sceneCount} (~${secondsPerScene}s each)
- The full script must flow naturally when read straight through with no breaks.

Return this exact JSON shape:
{
  "headline": "max 80 chars, scroll-stopping",
  "bodyText": "max 200 chars, the caption that goes with the video",
  "callToAction": "2-4 word natural CTA",
  "hashtags": ["max", "5", "relevant"],
  "fullScript": "The complete script as spoken word, with natural pauses (...), filler words, and emotion. Should match ${input.targetSeconds}s when read at natural pace (~2.5 words/sec).",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": ${secondsPerScene},
      "spokenLine": "the part of the script said during this scene (in ${langName})",
      "visualPrompt": "detailed Kling prompt: actor action + expression + product interaction + camera move + lighting + setting. NO text overlays. Describe MOTION.",
      "shotType": "close-up | medium shot | wide shot | over-the-shoulder | POV",
      "emotion": "specific emotion the actor shows"
    }
  ],
  "musicGenre": "specific genre (lo-fi hip-hop, upbeat acoustic, cinematic synth, etc.)",
  "musicMood": "specific mood",
  "predictedScore": 78,
  "scoreReasoning": "1-2 sentence honest assessment of why this score"
}`;

  const text = await generateText({ system: systemPrompt, prompt: userPrompt, maxTokens: 4000 });
  const raw = stripFences(text);
  const parsed = JSON.parse(raw) as EcommerceAdPlan;
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Plan returned no scenes");
  }
  return parsed;
}

function stripFences(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return t;
}

/**
 * Re-plan a single scene based on user instructions.
 * The user writes natural-language tweaks ("more excited", "brighter lighting", "show the product closer")
 * and we hand the original prompt + their instruction to Claude to produce an updated prompt.
 */
export async function refineScenePrompt(params: {
  originalPrompt: string;
  spokenLine: string;
  instruction: string;
  shotType?: string;
  language: string;
}): Promise<{ visualPrompt: string; shotType: string; emotion: string }> {
  const langName = LANG_NAMES[params.language] ?? "English";

  const systemPrompt = `You are an ecommerce video ad director. The user has an existing scene prompt for an AI video model (Kling 2.6 Pro). They want to change something about it using natural-language instructions.

YOUR JOB: Rewrite the visual prompt to incorporate their instruction while keeping everything else they didn't mention.

RULES:
- Keep the actor identity, the product, and the spoken line context the same
- Apply the user's instruction precisely (more energetic = visible energy in motion + expression; brighter lighting = describe new lighting; closer shot = change shot type)
- Output a complete, standalone Kling prompt — not a diff or instructions
- Always describe MOTION (what moves in the 5s clip) since this drives video output
- NO text overlays, NO logos in the visual
- Specify camera direction, lighting, expression, and product interaction

Output JSON only.`;

  const userPrompt = `ORIGINAL PROMPT:
${params.originalPrompt}

SPOKEN LINE THIS SCENE (${langName}): "${params.spokenLine}"

CURRENT SHOT TYPE: ${params.shotType ?? "unknown"}

USER'S INSTRUCTION: "${params.instruction}"

Rewrite the visual prompt to apply the instruction. Return:
{
  "visualPrompt": "complete updated prompt for Kling, describing motion + actor + product + camera + lighting",
  "shotType": "the shot type after applying the change",
  "emotion": "the dominant emotion the actor shows now"
}`;

  const text = await generateText({ system: systemPrompt, prompt: userPrompt, maxTokens: 1000 });
  return JSON.parse(stripFences(text));
}

/**
 * Take a user-provided spoken script and split it into N scenes with visual
 * prompts. Used when the UGC creator gives us a finished script — we still
 * need scenes + Kling prompts to feed the video pipeline.
 */
export async function splitCustomScriptIntoScenes(input: {
  script: string;
  productName?: string;
  productOffer?: string;
  productDescription?: string;
  productImageCount: number;
  actorName: string;
  actorVibe: string;
  actorSetting: string;
  visualInstructions?: string;
  language: string;
  targetSeconds: number;
}): Promise<EcommerceAdPlan> {
  const langName = LANG_NAMES[input.language] ?? "English";
  const { sceneCount, secondsPerScene } = computeSceneSchedule(input.targetSeconds);

  const systemPrompt = PLANNER_SYSTEM_PROMPT
    .replace("{langName}", langName)
    .replace("${secondsPerScene}", String(secondsPerScene)) +
    `\n\n═══ THIS JOB ═══\n` +
    `The creator wrote the spoken script themselves. Your job is NOT to rewrite their words — split the script verbatim across ${sceneCount} scenes and write a Kling-ready visualPrompt for each beat. ` +
    `Match each spokenLine slice to the visual that best supports it.${input.visualInstructions ? ` The creator added these visual notes — apply them to every scene: "${input.visualInstructions}"` : ""}`;

  const userPrompt = `SPOKEN SCRIPT (${langName}):
"""
${input.script}
"""

ACTOR: ${input.actorName} — vibe: ${input.actorVibe}, setting: ${input.actorSetting}
PRODUCT: ${input.productName ?? "(unspecified product)"}${input.productOffer ? ` — ${input.productOffer}` : ""}
${input.productDescription ? `WHAT THE PRODUCT IS / WHO IT'S FOR: ${input.productDescription}` : ""}
PRODUCT IMAGES UPLOADED: ${input.productImageCount}
TARGET LENGTH: ~${input.targetSeconds}s across ${sceneCount} scenes (~${secondsPerScene}s each)

Return:
{
  "headline": "max 80 chars derived from the script",
  "bodyText": "max 200 chars caption",
  "callToAction": "2-4 word natural CTA",
  "hashtags": ["max", "5"],
  "fullScript": "the script verbatim (you may add light punctuation/pauses)",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": ${secondsPerScene},
      "spokenLine": "the slice of the script said in this scene (in ${langName})",
      "visualPrompt": "Kling prompt: actor + action + product + camera + lighting + motion",
      "shotType": "close-up | medium shot | wide shot | over-the-shoulder | POV",
      "emotion": "specific emotion"
    }
  ],
  "musicGenre": "specific genre",
  "musicMood": "specific mood",
  "predictedScore": 75,
  "scoreReasoning": "1-2 sentences"
}`;

  const text = await generateText({ system: systemPrompt, prompt: userPrompt, maxTokens: 4000 });
  const parsed = JSON.parse(stripFences(text)) as EcommerceAdPlan;
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Script split returned no scenes");
  }
  return parsed;
}

/**
 * Free-tier: just generate prompts the user can copy/paste into other AI tools.
 * No actor compositing, no Kling, just structured ad plans.
 */
export async function generatePromptsOnly(input: {
  productName?: string;
  productOffer?: string;
  customScript?: string;
  language: string;
  numScenes?: number;
}): Promise<{
  fullScript: string;
  scenes: { sceneNumber: number; spokenLine: string; visualPrompt: string }[];
  musicGenre: string;
  hashtags: string[];
}> {
  const langName = LANG_NAMES[input.language] ?? "English";
  const sceneCount = input.numScenes ?? 3;

  const systemPrompt = `You are an ecommerce ad scriptwriter and visual director. You generate ad plans that creators can use in any AI video tool.

Output high-quality, copy-paste-ready prompts for image and video AI models. Each visual prompt should be detailed enough to produce a great result in Kling, Veo, Sora, or any other AI video tool.

Spoken script in ${langName}. Visual prompts in English (universal for AI models).

JSON only.`;

  const userPrompt = `Generate ad prompts for:
PRODUCT: ${input.productName ? `"${input.productName}"` : "(use the script below to infer the product)"}
OFFER: ${input.productOffer ?? "(none)"}
LANGUAGE: ${langName}
SCENES: ${sceneCount}
${input.customScript ? `\nCREATOR'S SCRIPT (split this verbatim across scenes — don't rewrite it):\n"""\n${input.customScript}\n"""` : ""}

Return:
{
  "fullScript": "${input.customScript ? "the script verbatim with light pauses" : `complete spoken UGC-style script in ${langName}, ~${Math.max(15, sceneCount * 5)} seconds`}",
  "scenes": [
    { "sceneNumber": 1, "spokenLine": "what the actor says (in ${langName})", "visualPrompt": "detailed AI video prompt in English" }
  ],
  "musicGenre": "specific genre",
  "hashtags": ["max 5"]
}`;

  const text = await generateText({ system: systemPrompt, prompt: userPrompt, maxTokens: 2000 });
  return JSON.parse(stripFences(text));
}
