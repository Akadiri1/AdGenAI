import { anthropic, CLAUDE_MODEL } from "@/lib/claude";

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
  productImageCount: number;
  actorName: string;
  actorVibe: string;
  actorSetting: string;
  language: string;
  targetSeconds: number;     // Total ad length (15, 30, 60)
  brandVoice?: string;       // From Brand Kit
  targetAudience?: string;   // From Brand Kit
};

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  it: "Italian", hi: "Hindi", ar: "Arabic", ja: "Japanese", zh: "Chinese",
  sw: "Swahili", yo: "Yoruba", ko: "Korean",
};

export async function planEcommerceAd(input: AdPlanInput): Promise<EcommerceAdPlan> {
  const langName = LANG_NAMES[input.language] ?? "English";

  // Number of scenes scales with target length: ~6 seconds per scene
  const sceneCount = Math.max(2, Math.min(6, Math.round(input.targetSeconds / 6)));
  const secondsPerScene = Math.round(input.targetSeconds / sceneCount);

  const systemPrompt = `You are the world's best ecommerce video ad director. You've made 10,000+ UGC-style ads that converted at 5-10x the industry average.

YOUR JOB: Plan a single, complete video ad — script + scene-by-scene direction — that an AI video model (Kling) will execute.

KEY PRINCIPLES:
1. THE HOOK IS EVERYTHING. The first 1-2 seconds decide if 95% of viewers stay or scroll. Open with movement, a bold statement, a problem they relate to, or surprise. Never a generic intro.
2. WRITE THE SCRIPT AS SPOKEN WORD. Real humans don't say "additionally" or "furthermore". They say "and", "honestly", "look", trail off mid-thought, restart. Include those imperfections.
3. ONE BIG IDEA PER AD. Not three benefits. One. Pick the strongest.
4. VISUAL = STORY. Each scene must visually advance the story. Don't repeat the same shot.
5. PRODUCT IN HAND/IN USE. Scenes must show the product being used, held, worn, or its result — never sitting on a shelf.
6. END WITH SOFT CTA. Like a friend's recommendation, not a sales pitch.

SCENE PROMPT RULES (these prompts go to Kling 2.6 Pro for image-to-video):
- Each prompt must describe MOTION (what's moving in the 5-second clip), not just a static scene
- Include camera direction: "slow push in", "handheld follow", "static wide shot", "tilt up"
- Specify the actor's action and expression
- Describe lighting: "golden hour", "soft natural light", "neon ambient"
- NO TEXT in the visuals (no "Sale!" signs, no logos, no buttons)
- Reference the actor by their vibe + setting; reference the product naturally

CRITICAL: ALL spoken script text MUST be in ${langName}. JSON keys stay English.

Output valid JSON only, no markdown fences.`;

  const userPrompt = `Create an ecommerce video ad plan.

BUSINESS:
- Name: ${input.businessName ?? "(not provided)"}
- Description: ${input.businessDescription ?? "(not provided)"}
- Brand voice: ${input.brandVoice ?? "natural, conversational"}
- Target audience: ${input.targetAudience ?? "(not specified)"}

PRODUCT:
- Name: "${input.productName}"
- Offer/promo: ${input.productOffer ?? "(none)"}
- Product images uploaded: ${input.productImageCount}

ACTOR (the person who will appear in the video):
- Name: ${input.actorName}
- Vibe: ${input.actorVibe}
- Setting: ${input.actorSetting}

OUTPUT REQUIREMENTS:
- Total ad length: ~${input.targetSeconds} seconds
- Number of scenes: ${sceneCount} (each ~${secondsPerScene}s)
- Language: ${langName}
- The full script must read naturally when spoken straight through

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

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response from Claude");

  let raw = block.text.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  const parsed = JSON.parse(raw) as EcommerceAdPlan;
  // Defensive defaults
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Plan returned no scenes");
  }
  return parsed;
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

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No refinement response");
  let raw = block.text.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(raw);
}

/**
 * Free-tier: just generate prompts the user can copy/paste into other AI tools.
 * No actor compositing, no Kling, just structured ad plans.
 */
export async function generatePromptsOnly(input: {
  productName: string;
  productOffer?: string;
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
PRODUCT: "${input.productName}"
OFFER: ${input.productOffer ?? "(none)"}
LANGUAGE: ${langName}
SCENES: ${sceneCount}

Return:
{
  "fullScript": "complete spoken UGC-style script in ${langName}, ~30 seconds",
  "scenes": [
    { "sceneNumber": 1, "spokenLine": "what the actor says (in ${langName})", "visualPrompt": "detailed AI video prompt in English" }
  ],
  "musicGenre": "specific genre",
  "hashtags": ["max 5"]
}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response");
  let raw = block.text.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(raw);
}
