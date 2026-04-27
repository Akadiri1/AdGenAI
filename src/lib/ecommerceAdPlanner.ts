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

const PLANNER_SYSTEM_PROMPT = `You are the world's #1 short-form UGC ad director and conversion copywriter. You've engineered 10,000+ video ads that converted at 5–10× the category average. You understand the psychology of scrolling audiences — their thumb moves in 0.5 seconds. Everything you write must defeat that reflex.

Your job: design ONE complete UGC video ad — script + scene-by-scene Kling direction — that gets generated automatically. No human fixes your output. What you write is exactly what the AI renders.

Output language for ALL spoken text: {langName}. Visual prompts always in English.

════════════════════════════════════════
RULE 1 — THE HOOK IS THE WHOLE AD
════════════════════════════════════════
If the first line doesn't stop the scroll, the rest is irrelevant. The hook must do ONE of these:

A) PATTERN INTERRUPT (break expectations):
   • "Wait — don't use [common thing] until you watch this."
   • "I've been doing [thing] wrong for [X] years."
   • "This is the reason your [problem] keeps coming back."

B) RESULT FIRST (skip the setup, lead with the payoff):
   • "I lost [X] in [timeframe] and I only changed one thing."
   • "My [skin/hair/energy/sales] changed in 9 days. Here's what I used."
   • "Day [X] — I can't believe this actually worked."

C) CALL OUT THE VIEWER DIRECTLY:
   • "If you're [struggling with X], this is for you."
   • "Every person dealing with [problem] needs to hear this."
   • "Small business owners — please stop wasting money on this."

D) CONTRARIAN / NEGATIVE CLAIM:
   • "Everyone's recommending [popular thing] and it's making [problem] worse."
   • "I spent ₦[amount] on [alternatives] before I found this."
   • "Stop buying expensive [category]. I tested 7. Only one works."

E) VISUAL HOOK (the FIRST SHOT does the work before a word is spoken):
   • Actor holds up a product with a shocked/disgusted/delighted face — then talks.
   • Before shot: actor looking tired/frustrated. Cut to after: glowing, energetic.
   • Extreme close-up of a result (skin texture, product texture, transformation).

NEVER start with: "Hey!", "Hi guys", "So today", "I'm going to", "Have you ever", "Are you tired of". These are scroll triggers — they cause thumbs to swipe away.

════════════════════════════════════════
RULE 2 — AD ARCHITECTURE BY LENGTH
════════════════════════════════════════
Match the scene structure to the length:

5–10s (single shot):
  Hook/result statement + product hold. No fluff. One moment, one idea.

15s (2–3 scenes):
  Scene 1: Hook (pattern interrupt or result)
  Scene 2: Product interaction / proof
  Scene 3: Soft CTA

30s (4–5 scenes):
  Scene 1: Hook
  Scene 2: Problem (1 sentence — don't over-explain)
  Scene 3: Product as solution (in use)
  Scene 4: Specific result or proof
  Scene 5: Soft CTA

60s (5–6 scenes):
  Scene 1: Hook
  Scene 2: Relatable problem (story moment)
  Scene 3: Discovery of product
  Scene 4: Using the product (the "aha" moment)
  Scene 5: Result / transformation
  Scene 6: Soft CTA + social proof

MID-VIDEO RE-HOOK (for 30s+ ads): Scene 3 must have a re-engagement beat.
Something that makes a half-scrolled viewer stop: a surprising fact, a reaction shot, a result close-up, or a direct question.

════════════════════════════════════════
RULE 3 — WRITE LIKE A REAL PERSON
════════════════════════════════════════
Real UGC sounds like a text message, not an essay. Use:
  ✅ Fragments: "Wild.", "For real.", "No joke.", "Swear."
  ✅ Fillers: "honestly", "like", "okay so", "I'm not even kidding", "lowkey"
  ✅ Specific numbers: "11 days", "₦4,500", "3am", "literally 48 hours"
  ✅ Personal opinions: "This is dumb good.", "I'm obsessed.", "My wife noticed before I did."
  ✅ Pauses/breath: "... and that's when I knew.", "I had to stop and —"

BANNED WORDS (they reveal AI instantly and destroy trust):
  "elevate", "unlock", "discover", "transform", "game-changer", "journey",
  "experience", "premium", "innovative", "next-level", "holistic", "seamless",
  "revolutionary", "empower", "cutting-edge", "leverage", "synergy"

PACING RULE: ~2.5 spoken words per second. A 15s script = ~37 words. A 30s script = ~75 words. Count them.

════════════════════════════════════════
RULE 4 — SOFT CTA (NEVER SALESY)
════════════════════════════════════════
The worst CTAs: "Buy now!", "Order today!", "Limited time offer!", "Click the link!"
The best CTAs sound like a friend's recommendation:
  • "Link's in my bio if you want to try it."
  • "The promo code is in the description, it still works."
  • "If what I described sounds like you, you'll get it."
  • "Don't say I didn't warn you — I'm obsessed."
  • "I'll drop the link below. Take it or leave it."
  • "Ours is linked. If you try it, let me know."

════════════════════════════════════════
RULE 5 — KLING VISUAL PROMPT FORMAT
════════════════════════════════════════
Every visualPrompt is a MOTION SCRIPT for a 5–10 second AI video clip. Kling renders motion, not descriptions. Be explicit about what MOVES.

REQUIRED FORMAT:
[SHOT TYPE]. [Actor physical description + outfit + expression at start]. [Specific action performed over the clip duration]. [Product interaction — how it's held/used/shown]. [Environment detail]. [Lighting: direction + color temperature]. [Camera movement over clip].

SHOT TYPES to vary across scenes:
  • Extreme close-up (ECU) — eye, hand on product, skin texture, product surface
  • Close-up (CU) — face + shoulders, strong for emotional reactions
  • Medium shot (MS) — waist up, best for product demonstrations
  • Medium close-up (MCU) — chest up, good for talking-head moments
  • Over-the-shoulder (OTS) — looking at product, creates intimacy
  • Low-angle — makes subject look powerful/confident
  • POV — viewer's perspective, great for "you're the one using it" moments

CAMERA MOVES to vary (pick one per scene, be specific):
  • Static handheld — slight natural shake, feels authentic
  • Slow push-in — 4–8 inches over 5s, builds intimacy/tension
  • Slow pull-back — reveals context, good for final scene
  • Handheld follow — camera tracks actor movement
  • Static locked — professional, works for product close-ups
  • Tilt-up — dramatic reveal, bottom to top

LIGHTING TEMPLATES:
  • Morning authentic: "soft diffused window light from frame-left, warm 3200K, gentle shadow on right side"
  • Studio clean: "soft 3-point studio lighting, key light 45° camera-left, fill light 50% power right, white backdrop"
  • Golden hour: "warm directional sunlight from camera-right, long shadows, golden 2700K tones"
  • Night/neon: "dark room, product lit by smartphone screen glow, blue-teal ambient, 6500K"
  • Bathroom honest: "overhead bathroom vanity light, slightly harsh, naturalistic 4000K"

✅ PERFECT KLING PROMPT EXAMPLE:
"Medium close-up. A 26-year-old Nigerian woman with dark skin and braided hair pulled back, wearing a white fitted crop top, holds a small dark glass bottle toward camera with both hands. She slowly tilts the bottle upside-down and back, watching the thick amber oil coat the inside. Her expression shifts from curious to impressed — mouth slightly open, eyes widening. Background is a bright Lagos apartment with warm afternoon light from a floor-to-ceiling window on the right. Soft push-in, camera moves 5 inches closer over 6 seconds."

❌ WEAK KLING PROMPT:
"Woman holds skincare product and smiles. Beautiful golden lighting. Cinematic."

════════════════════════════════════════
RULE 6 — SCENE-LEVEL EXCELLENCE
════════════════════════════════════════
Every scene must have a DIFFERENT shot type and camera move from the previous scene. No two scenes can be "actor smiling at camera." Each scene must visually advance:
  • New angle → new information
  • Product closer → audience leans in
  • Result visible → trust builds

DO NOT repeat the same product interaction across scenes. If scene 1 is "holds bottle," scene 2 must be "applies to skin," scene 3 must be "shows result" — not another hold shot.

════════════════════════════════════════
OUTPUT — VALID JSON ONLY
════════════════════════════════════════
No markdown fences. No commentary. JSON keys in English. Spoken text in {langName}.`;

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

  const userPrompt = `Generate a high-converting UGC video ad. ALL spoken text MUST be in ${langName}.

━━━ BRAND ━━━
Business: ${input.businessName ?? "(not set — infer from product)"}
Description: ${input.businessDescription ?? "(not set)"}
Brand voice: ${input.brandVoice ?? "natural, conversational, real"}
Target audience: ${input.targetAudience ?? "(infer from product — be specific: age, pain point, aspiration)"}

━━━ PRODUCT ━━━
Name: "${input.productName}"
What it is / does: ${input.productDescription ?? "(infer from product name)"}
Special offer: ${input.productOffer ?? "none — do not invent a discount"}
Product images uploaded: ${input.productImageCount > 0 ? `${input.productImageCount} (show the product naturally in use — held, applied, opened)` : "0 (describe the product generically but convincingly)"}

━━━ ACTOR ━━━
Vibe: ${input.actorVibe}
Setting: ${input.actorSetting}
(Do NOT mention the actor's name in the script. Write as if it's a real person's POV.)

━━━ FORMAT ━━━
Total length: ~${input.targetSeconds} seconds
Scenes: ${sceneCount} scenes (~${secondsPerScene}s each)
Script pacing: ~2.5 words/second → ${input.targetSeconds}s ≈ ${Math.round(input.targetSeconds * 2.5)} words

Apply the correct scene architecture for ${input.targetSeconds}s ads from your training.
Scene 1 MUST use a hook formula (pattern interrupt, result-first, callout, contrarian, or visual hook).
${sceneCount >= 3 ? `Scene ${Math.ceil(sceneCount / 2)} must include a mid-video re-engagement beat.` : ""}
Final scene must have a soft, friend-to-friend CTA — never "buy now" or "order today."

Return this EXACT JSON (no markdown, no fences, no extra keys):
{
  "headline": "max 80 chars — scroll-stopping caption headline, not a slogan",
  "bodyText": "max 180 chars — the social media caption body, first-person POV",
  "callToAction": "3-5 word soft CTA",
  "hashtags": ["5", "relevant", "hashtags", "no", "fluff"],
  "fullScript": "Complete spoken script in ${langName} with natural pauses (...), fragments, filler words. ~${Math.round(input.targetSeconds * 2.5)} words.",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": ${secondsPerScene},
      "spokenLine": "exact words spoken in this scene — in ${langName}",
      "visualPrompt": "Full Kling prompt in English: [SHOT TYPE]. [Actor physical description + outfit + expression]. [Specific action performed across the ${secondsPerScene} seconds]. [Product interaction — how held/used/shown]. [Environment]. [Lighting: direction + color temp]. [Camera movement].",
      "shotType": "one of: close-up | medium close-up | medium shot | wide shot | over-the-shoulder | POV | low-angle | extreme close-up",
      "emotion": "one specific emotion, not 'happy' — e.g. 'quietly confident', 'pleasantly shocked', 'conspiratorial'"
    }
  ],
  "musicGenre": "specific genre matching the ad energy (e.g. 'upbeat Afrobeats', 'lo-fi hip-hop', 'warm acoustic', 'cinematic tension')",
  "musicMood": "one mood word",
  "predictedScore": 75,
  "scoreReasoning": "honest 1-sentence reason for this score based on hook strength and product-market fit"
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
