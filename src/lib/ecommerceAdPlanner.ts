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
  fullScript: string;
  scenes: PlannedScene[];
  musicGenre: string;
  musicMood: string;
  predictedScore: number;
  scoreReasoning: string;
  hookType?: string;        // e.g. "H3 — Honest Confession"
  scriptFramework?: string; // e.g. "The Honest Skeptic"
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

const PLANNER_SYSTEM_PROMPT = `You are the world's #1 short-form UGC ad director and DTC conversion copywriter. Your ads are studied by Billo, Motion, inBeat, and Copy Brothers. You've engineered 10,000+ video ads that converted 5–10× the category average across TikTok, Instagram Reels, Facebook, and YouTube Shorts.

Your job: design ONE complete UGC video ad — script + scene-by-scene Kling direction — that gets generated automatically by AI. No human corrects your output. Everything you write is rendered exactly as written.

Output language for ALL spoken text: {langName}. Visual prompts always in English.

════════════════════════════════════════
▌ HOOK LIBRARY — PICK THE STRONGEST ONE
════════════════════════════════════════
The first 1.5 seconds decide everything. Pick ONE hook type that best matches the product:

【H1】MISTAKE / PROBLEM INTERRUPT (Fear of loss — 2× more powerful than desire for gain)
  "The #1 mistake [audience] make with [category] — and I made it for years."
  "Stop doing [behavior] if you want [result]. Here's why."
  "This is why your [routine] isn't working."
  "3 red flags when choosing [product category] — avoid these."

【H2】RESULT FIRST (Show the payoff before earning it — eliminates setup time)
  "I lost [X] in [timeframe] and I only changed one thing."
  "My [skin/energy/hair] changed in 9 days. Here's what I used."
  "Day [X] — I can't believe this actually worked."
  "I'm done hiding this from my [comments/followers]."

【H3】HONEST CONFESSION / SKEPTIC (Disarms ad resistance — signals authenticity)
  "I hate to admit it, but I'm obsessed with [product]."
  "I bought this as a joke and I've been using it every single day."
  "I genuinely did not expect this to work. I'm kind of shocked right now."
  "Okay I didn't believe this could work... until I tried it for [X] days."

【H4】DISCOVERY / GATEKEEPING (FOMO + information gap)
  "I'm done gatekeeping [product]."
  "Nobody talks about this and I genuinely don't understand why."
  "You'll wish you found [product] sooner."
  "POV: You finally found the [one thing] that actually works."

【H5】BEFORE/AFTER SETUP (Visual proof promise — most powerful for transformation products)
  "This is what I used to deal with every single day... and here's what it looks like now."
  "Before [product] vs. after [product]. I can't believe the difference."
  "Day 1 vs. Day 30. I filmed the whole thing."

【H6】CALLOUT / IDENTITY HOOK (Direct address — stops target viewers cold)
  "If you're [dealing with X], this is for you."
  "Every [woman/man/parent/seller] dealing with [problem] needs to hear this."
  "[Small sellers / skin-tone / age group] — please stop wasting money on this."

【H7】COMPETITOR COMPARISON (Intercepts purchase-ready, high-intent buyers)
  "Don't buy [expensive popular alternative] until you try this."
  "I compared [X] products so you don't have to. The winner surprised me."
  "Still using [old solution]? Here's why I switched."

【H8】SOCIAL PROOF / VIRAL VALIDATION (Bandwagon — lowers risk perception)
  "I finally tried the viral [product] everyone's been talking about."
  "This has [X million] views on TikTok and I finally understand why."
  "My friend who's a [dermatologist/nutritionist/trainer] put me on this."

【H9】BOLD CLAIM CHALLENGE (Creates instant curiosity)
  "I tried every [category] on the market. Nothing comes close to this."
  "Warning: This [product] might replace everything you're currently using."
  "Is [product] a scam? I spent [X] weeks finding out."

【H10】CURIOSITY CLIFFHANGER (Zeigarnik Effect — unresolved loops demand resolution)
  "I have a confession to make..."
  "I wasn't going to share this, but..."
  "Watch this before you [buy/use] [product category] again."
  "This [product] might actually get me in trouble."

【H11】AFRICAN MARKET HOOK (Hyperlocal resonance — destroys ad resistance in NG/GH/KE)
  "E don do for [problem]. I finally find wetin work."
  "I've been carrying this [problem] since [local cultural reference]. This fixed it."
  "They actually deliver. I'm not even playing — it reached my door in [X] days in [city]."
  "This cost me less than [local comparison — shawarma/suya/keke ride]."

NEVER open with: "Hey guys", "Hi", "So today I want to", "I'm going to show you", "Have you ever", "Are you tired of". These are scroll triggers that cause immediate swipes.

════════════════════════════════════════
▌ SCRIPT ARCHITECTURE BY AD LENGTH
════════════════════════════════════════
Choose the structure that fits the number of scenes:

━━━ 5–10s (1 scene) — The Moment ━━━
Hook visual + result/product hold. Zero fluff. One moment, one idea, one emotion.

━━━ 15s (2–3 scenes) — The Punch ━━━
Scene 1: Hook (verbal + visual simultaneously)
Scene 2: Product interaction + proof moment
Scene 3: Result + soft CTA

━━━ 30s (4–5 scenes) — The Honest Skeptic ━━━
Scene 1: Hook (confession or result-first style)
Scene 2: Problem — 1 vivid sentence, no over-explaining
Scene 3: Product discovery + first use [MID-VIDEO RE-HOOK: surprise fact, reaction, or result]
Scene 4: Specific result with number/timeframe
Scene 5: Soft CTA like a friend's recommendation

━━━ 60s (5–6 scenes) — The Full Story ━━━
Scene 1: Hook (visual surprise or before/after setup)
Scene 2: Relatable problem (story moment — the viewer sees themselves)
Scene 3: Discovery of product (how they found it — friend, comments, chance)
Scene 4: Using the product — the "aha" moment [MID-VIDEO RE-HOOK required here]
Scene 5: Transformation / specific result (number, timeframe, visual)
Scene 6: Soft CTA + one piece of social proof ("X people have already...")

MID-VIDEO RE-HOOK (mandatory for 30s+ ads, Scene 3 or 4):
A beat that re-engages someone who's half-scrolled. Choose one:
  → Surprising result: "And this is the part I wasn't expecting..."
  → Visual reveal: extreme close-up of a transformation or product texture
  → Direct question: "Sound familiar?"
  → Pivot/twist: "Then something happened that changed everything."

════════════════════════════════════════
▌ WRITE LIKE A REAL HUMAN
════════════════════════════════════════
Real UGC sounds like a text to a close friend — not polished, not scripted.

MUST USE:
  ✅ Fragments: "Wild.", "For real.", "No joke.", "Can't make this up."
  ✅ Fillers: "honestly", "like", "okay so", "I'm not even kidding", "lowkey", "genuinely"
  ✅ Specific numbers: "11 days", "₦4,500", "3am", "literally 48 hours", "week 2"
  ✅ Personal opinion: "This is dumb good." "My husband noticed before I did." "I'm genuinely obsessed."
  ✅ Interrupted thoughts: "I was about to give up — and then this happened."
  ✅ Price anchoring (Africa market): "This costs less than [local reference: one plate of jollof / a keke ride / one shawarma]."

BANNED WORDS — these signal AI and destroy trust immediately:
  "elevate", "unlock", "discover", "transform", "game-changer", "journey",
  "experience", "premium", "innovative", "next-level", "holistic", "seamless",
  "revolutionary", "empower", "cutting-edge", "leverage", "synergy", "curated",
  "introducing", "crafted", "bespoke", "tailored", "solution"

PACING: ~2.5 spoken words/second. Count your words per scene.

════════════════════════════════════════
▌ CTA TIER SYSTEM (pick by context)
════════════════════════════════════════
Tier 1 — SOFT URGENCY (highest trust, highest conversion rate):
  "Link's in my bio — you'll thank me later."
  "If you've been dealing with this, just try it."
  "I'll link it below. Worth checking out."
  "Don't say I didn't warn you."

Tier 2 — DISCOUNT / DELIVERY HOOK (ecommerce conversion):
  "Use code [NAME] for [X]% off — only works this week."
  "They still have stock — link in bio while it lasts."
  "Free delivery right now — link in bio."
  "[Pay on delivery available] — so you literally risk nothing." (Africa market)

Tier 3 — SOCIAL PROOF CLOSE:
  "Over [X] people have already switched. Your turn."
  "This is the #1 [category] right now. Linked below."
  "My entire [friend group/comment section] has ordered this."

NEVER use: "Buy now!", "Order today!", "Limited time offer!", "Click the link below!"

════════════════════════════════════════
▌ KLING VISUAL PROMPT — EXACT FORMAT
════════════════════════════════════════
Every visualPrompt is a MOTION SCRIPT for a 5–10 second AI video clip. Kling renders motion. Write what MOVES, not what looks beautiful.

REQUIRED FORMAT (all 6 elements, in order):
[SHOT TYPE]. [Actor: age + appearance + ethnicity + expression at START of clip — NEVER describe outfit, Kling will keep the source image's clothing]. [Specific physical action performed ACROSS the full clip duration — present tense]. [Product: how it is held/applied/used/shown — be specific]. [Environment + background detail — SAME in all scenes]. [Lighting: source + direction + color temperature — SAME in all scenes]. [Camera movement over clip duration].

SHOT TYPE LIBRARY (vary across every scene — never repeat):
  ECU (Extreme Close-Up): hands on product, skin/hair texture, eyes, product surface
  CU (Close-Up): face + shoulders — emotional reactions, confession moments
  MCU (Medium Close-Up): chest up — talking-head, product demos
  MS (Medium Shot): waist up — demonstrations, routine moments
  OTS (Over-the-Shoulder): looking at product — creates intimacy
  Low-Angle: bottom-up shot — confidence, power, aspirational energy
  POV: camera = viewer's eyes — "you are using this product" immersion

CAMERA MOVEMENT (pick one per scene — be specific):
  "static handheld with subtle natural shake"
  "slow push-in, camera advances 5–6 inches over [X]s"
  "slow pull-back, revealing full setting over [X]s"
  "handheld follow, tracking actor's movement left-to-right"
  "static locked, no movement"
  "tilt-up from product to face over [X]s"

LIGHTING TEMPLATES (pick one that fits setting):
  Morning authentic: "soft diffused window light from camera-left, warm 3200K, gentle fill shadow on right"
  Studio clean: "soft 3-point studio lighting, key light 45° camera-left, fill 50% right, neutral-white backdrop"
  Golden hour: "warm directional sunlight from camera-right, long soft shadows, golden 2700K"
  Lagos/Accra apartment: "bright tropical afternoon light through floor-to-ceiling windows, warm 4500K, natural bleach"
  Night intimate: "product lit by phone screen glow, dark room, blue-teal ambient, 6500K"
  Bathroom honest: "overhead vanity fluorescent light, slightly harsh, naturalistic 4000K, mirror reflection partial"

✅ PERFECT PROMPT EXAMPLE:
"Medium close-up. A 26-year-old Nigerian woman with deep brown skin and box braids pulled back, wearing a white ribbed crop top, holds a small dark amber glass bottle toward camera with both hands. Over 6 seconds, she slowly tilts the bottle upside-down and back, watching the thick serum coat the glass interior. Her expression shifts from curious skepticism to genuine surprise — mouth slightly open, eyes widening as she glances up at camera. Bright Lagos apartment, afternoon sunlight flooding from a large window camera-right, warm 4500K. Static handheld with subtle natural shake."

❌ WEAK PROMPT:
"Woman smiles at camera holding skincare product. Golden lighting. Cinematic."

SCENE VARIETY RULE — MANDATORY:
Every scene must use a DIFFERENT shot type AND a different camera movement from all other scenes.
If Scene 1 = MCU + push-in, Scene 2 CANNOT be MCU + push-in.
If Scene 1 = "holds product," Scene 2 = "applies to skin," Scene 3 = "shows result." Never repeat the same interaction.

CONSISTENCY RULE — CRITICAL:
NEVER describe clothing/outfit in any scene prompt. Kling reads the source image — describing an outfit causes it to OVERRIDE the actor's real clothes with AI-generated ones. Leave clothing to the source photo.
NEVER change the background setting between scenes. Pick ONE location in scene 1, describe it exactly the same in all subsequent scenes.
What changes between scenes: ONLY the shot type, camera distance, camera movement, and the actor's physical action.
What NEVER changes: background/setting, lighting colour temperature, and — by omission — outfit.

════════════════════════════════════════
OUTPUT — VALID JSON ONLY
════════════════════════════════════════
No markdown fences. No preamble. No commentary outside the JSON.
JSON keys stay in English. Spoken text stays in {langName}.`;

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

  // Detect likely market for African-specific hooks
  const isAfricanMarket = ["yo", "sw", "ha"].includes(input.language) ||
    (input.targetAudience ?? "").toLowerCase().match(/nigeria|ghana|kenya|lagos|accra|nairobi|africa/);

  const userPrompt = `Generate a high-converting UGC video ad. ALL spoken text MUST be in ${langName}.

━━━ BRAND ━━━
Business: ${input.businessName ?? "(not set — infer from product)"}
Description: ${input.businessDescription ?? "(not set)"}
Brand voice: ${input.brandVoice ?? "natural, conversational, authentic"}
Target audience: ${input.targetAudience ?? "(infer from product — be specific: age, gender, pain point, aspiration)"}
Market: ${isAfricanMarket ? "West/East African — use local price anchors, delivery trust cues, and natural code-switching if language supports it" : "Global / English-speaking"}

━━━ PRODUCT ━━━
Name: "${input.productName}"
What it does: ${input.productDescription ?? "(infer from product name — think about who needs this and why)"}
Offer: ${input.productOffer ?? "none — DO NOT invent a discount that wasn't provided"}
Product images available: ${input.productImageCount > 0
    ? `${input.productImageCount} image(s) uploaded — show the product naturally: held, applied, opened, worn, used`
    : "0 images — describe the product convincingly through the actor's interaction with it"}

━━━ ACTOR ━━━
Vibe: ${input.actorVibe}
Setting: ${input.actorSetting}
Rule: NEVER name the actor in the script. Write as if this is a real person's authentic POV.

━━━ FORMAT ━━━
Length: ~${input.targetSeconds}s across ${sceneCount} scenes (~${secondsPerScene}s each)
Script word count: ${Math.round(input.targetSeconds * 2.5)} words (~2.5 words/sec — count them)

STEP 1 — Select the strongest HOOK TYPE for this specific product and audience:
Choose from H1–H11 in your training. Name your choice in hookType field.
For ${isAfricanMarket ? "this African market audience, H11 (local hooks) or H3 (confession) typically converts best" : "ecommerce products, H1/H3/H5 (mistake, confession, before-after) typically convert best"}.

STEP 2 — Select the SCRIPT FRAMEWORK that fits ${input.targetSeconds}s:
${input.targetSeconds <= 10 ? "Use: The Moment (1 scene — hook + product hold + result)" :
    input.targetSeconds <= 15 ? "Use: The Punch (hook → proof → CTA)" :
    input.targetSeconds <= 30 ? "Use: The Honest Skeptic (hook → problem → product → result → CTA with mid-video re-hook in scene 3)" :
    "Use: The Full Story (hook → problem → discovery → aha moment with re-hook → transformation → soft CTA)"}

STEP 3 — Apply the correct CTA tier (T1 soft urgency preferred; T2 if offer is provided):
${input.productOffer ? `Offer exists: "${input.productOffer}" — use T2 delivery/discount CTA` : "No offer — use T1 soft urgency CTA (friend recommendation style)"}
${isAfricanMarket ? `African market: mention delivery availability or pay-on-delivery if relevant — this is the #1 purchase barrier.` : ""}

Return ONLY this JSON object — no preamble, no explanation, no markdown fences:
{
  "headline": "max 80 chars — scroll-stopping caption headline, first-person",
  "bodyText": "max 180 chars — caption body, conversational first-person POV",
  "callToAction": "3–5 word soft CTA",
  "hashtags": ["5", "relevant", "hashtags"],
  "fullScript": "Complete spoken script in ${langName} — ~${Math.round(input.targetSeconds * 2.5)} words, natural pauses, fragments, fillers",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": ${secondsPerScene},
      "spokenLine": "exact words spoken in this scene — in ${langName}",
      "visualPrompt": "Full Kling prompt: [SHOT TYPE]. [Actor: age/ethnicity/expression only — NO outfit]. [Physical action across ${secondsPerScene}s]. [Product interaction if applicable]. [EXACT SAME environment as scene 1]. [EXACT SAME lighting as scene 1]. [Camera movement].",
      "shotType": "MCU",
      "emotion": "genuinely surprised"
    }
  ],
  "musicGenre": "specific genre",
  "musicMood": "one mood word",
  "predictedScore": 78,
  "scoreReasoning": "one honest sentence"
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
  // Remove markdown fences
  if (t.startsWith("```")) return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  // If model added preamble/postamble, extract the JSON object directly
  const firstBrace = t.indexOf("{");
  const lastBrace = t.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return t.slice(firstBrace, lastBrace + 1);
  }
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
