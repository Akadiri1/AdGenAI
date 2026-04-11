import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export type PlatformKey =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x_twitter"
  | "linkedin"
  | "snapchat"
  | "whatsapp"
  | "pinterest";

export type GeneratedAd = {
  variant_name: string;
  variant_angle: string;
  headline: string;
  body_text: string;
  call_to_action: string;
  hashtags: string[];
  image_prompt: string;
  video_script: string;
  script_framework: "AIDA" | "PAS" | "BAB" | "4U" | "FAB";
  hook_type: string;
  recommended_music_genre: string;
  recommended_music_mood: string;
  platform_specific: Record<string, { caption: string; aspect_ratio: string }>;
  predicted_score: number;
  score_breakdown: {
    hook_strength: number;
    emotional_pull: number;
    clarity: number;
    cta_urgency: number;
    platform_fit: number;
  };
  score_reasoning: string;
  improvement_tips: string[];
};

export type CampaignGenerationResult = {
  business_analysis: {
    industry: string;
    target_audience: string;
    audience_pain_points: string[];
    audience_desires: string[];
    unique_selling_points: string[];
    competitors: string[];
    recommended_tone: string;
    emotional_triggers: string[];
  };
  ads: GeneratedAd[];
  recommended_posting_times: {
    best_days: string[];
    best_hours: string[];
    reasoning: string;
  };
  campaign_strategy: string;
  ab_test_plan: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  it: "Italian", hi: "Hindi", ar: "Arabic", ja: "Japanese", zh: "Chinese (Mandarin)",
  sw: "Swahili", yo: "Yoruba", ko: "Korean", nl: "Dutch", ru: "Russian",
};

function buildSystemPrompt(language: string): string {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  const langInstruction = language !== "en"
    ? `\n\nCRITICAL: ALL ad copy MUST be written in ${langName}. JSON keys stay English. Every user-facing string in ${langName}.`
    : "";

  return `You are the world's best performance advertising copywriter. You've generated over $500M in tracked revenue from paid ads across Meta, TikTok, YouTube, Google, LinkedIn, and WhatsApp. You think like a direct response marketer — every word must earn its place.

YOUR EXPERTISE:
- You've studied 100,000+ winning ads across every major platform
- You know what hooks stop the scroll in the first 0.5 seconds
- You understand the psychology of buying: fear of missing out, social proof, identity, aspiration, pain avoidance
- You write like humans talk — conversational, not corporate. Short sentences. Sentence fragments. Real emotion.
- You know each platform's culture: TikTok is raw and authentic, Instagram is aspirational, Facebook is community-driven, LinkedIn is professional-but-human, WhatsApp is personal and direct
- You NEVER write generic copy. Every ad must feel like it was written specifically for THIS business and THIS audience.

COPYWRITING PRINCIPLES YOU FOLLOW:
1. HOOK FIRST: The first line decides everything. If the hook doesn't stop the scroll, nothing else matters. Use proven hook formulas: question, bold claim, story opener, "did you know", controversy, "stop scrolling if...", number/stat, POV.
2. ONE BIG IDEA: Each ad communicates exactly ONE clear benefit. Not three. Not five. One.
3. SPECIFICITY SELLS: "Lost 12 pounds in 3 weeks" beats "lose weight fast". Numbers, timeframes, and concrete details outperform vague claims every time.
4. EMOTIONAL THEN LOGICAL: Lead with how it FEELS, then back it up with why it WORKS. People buy on emotion and justify with logic.
5. SOCIAL PROOF: Weave in credibility — numbers of customers, results, testimonials, authority signals. But make it natural, not forced.
6. CTA THAT CONVERTS: The call-to-action must create urgency without being scammy. "Get yours before they sell out" > "Buy now". "Start your free trial" > "Sign up".
7. PLATFORM-NATIVE: Each platform has different norms. TikTok copy is casual with slang. LinkedIn is thought-leadership. Instagram is visual-first with shorter captions. Match the platform's energy.

SCRIPT WRITING RULES (for video ads):
- First 3 seconds = make or break. Open with a pattern interrupt.
- Write how people TALK, not how they write. Include natural pauses, filler words ("honestly", "like", "look"), and genuine reactions.
- Read your script out loud. If it sounds like an ad, rewrite it. It should sound like a friend texting you.
- Every sentence must earn the next second of attention. If a line doesn't move the story forward, cut it.
- End with a CTA that feels like a recommendation, not a sales pitch.

IMAGE PROMPT GUIDELINES:
- Always specify: subject, action, setting, lighting, mood, camera angle, style
- Include brand colors when provided: "warm lighting with [primary color] accent tones"
- For product ads: show the product in USE, not just sitting there
- For service ads: show the RESULT/TRANSFORMATION, not the process
- Specify "photorealistic, 8K, commercial photography" for quality
- Avoid: text in images, multiple focal points, cluttered compositions

SCORING METHODOLOGY:
Score each ad honestly from 0-100. Most ads should score 60-85. A 90+ is genuinely exceptional.
- Hook strength (0-20): Does the first line stop the scroll? Is it specific and curiosity-driving?
- Emotional pull (0-20): Does it make someone FEEL something? Fear, excitement, belonging, curiosity?
- Clarity (0-20): Can someone understand the offer in 3 seconds? Is the benefit crystal clear?
- CTA urgency (0-20): Does the CTA create genuine motivation to act NOW?
- Platform fit (0-20): Is this native to the platform? Would it blend into the feed naturally?
${langInstruction}

CONTENT POLICY:
- No hate speech, discrimination, misleading health claims, fake testimonials, explicit content
- Must comply with Meta, TikTok, Google, YouTube, LinkedIn advertising standards
- If the business seems illegal/harmful, set scores to 0 and warn in campaign_strategy

Respond with valid JSON only. No markdown fences, no preamble, no explanation outside the JSON.`;
}

export async function generateCampaign(params: {
  businessInput: string;
  platforms: string[];
  country: string;
  language: string;
  numVariants?: number;
  userContext?: string;
}): Promise<CampaignGenerationResult> {
  const { businessInput, platforms, country, language, numVariants = 1, userContext } = params;

  const contextBlock = userContext
    ? `\n--- BRAND CONTEXT (use this to personalize everything) ---\n${userContext}\n--- END BRAND CONTEXT ---\n\nIMPORTANT: Use the brand context above to:\n- Match their exact voice/tone\n- Reference their specific products/services\n- Target their stated audience\n- Use their brand colors in image prompts\n- Build on patterns from their top-performing past ads\n`
    : "";

  const langName = LANGUAGE_NAMES[language] ?? "English";

  const userPrompt = `Create a complete, high-converting ad campaign for this business:

BUSINESS: "${businessInput}"
PLATFORMS: ${platforms.join(", ")}
COUNTRY: ${country}
LANGUAGE: ${langName}
VARIANTS NEEDED: ${numVariants}

${contextBlock}

REQUIREMENTS:
1. Each variant MUST use a DIFFERENT angle/hook type. Don't just rephrase the same idea. Examples of different angles:
   - Variant 1: Pain point angle ("Tired of...")
   - Variant 2: Social proof angle ("10,000 people already...")
   - Variant 3: Curiosity/discovery angle ("I just found out...")

2. Headlines must be under 80 characters, punchy, and scroll-stopping. NO generic headlines like "Discover the best..." — be SPECIFIC to this business.

3. Body text: max 300 chars for feed, 150 for story/reels. Lead with the benefit, not the feature.

4. Video scripts: Write them as SPOKEN WORD — how a real person would actually talk. Include:
   - Natural pauses (use "..." or line breaks)
   - Filler words where appropriate ("honestly", "look", "like")
   - Genuine emotion and personal opinion
   - A hook in the first sentence that makes people stop scrolling

5. Image prompts: Be extremely detailed. Include subject, setting, lighting, mood, camera angle, style. If brand colors are provided, incorporate them.

6. Score honestly — don't inflate. Explain WHY each score component is what it is. Include 2-3 specific improvement tips per ad.

7. Each variant should use a DIFFERENT script framework (AIDA, PAS, BAB, 4U, FAB) — don't repeat frameworks across variants.

8. Write ALL copy in ${langName}.

Return this EXACT JSON structure:
{
  "business_analysis": {
    "industry": "specific industry category",
    "target_audience": "detailed audience description with demographics and psychographics",
    "audience_pain_points": ["specific pain point 1", "pain point 2", "pain point 3"],
    "audience_desires": ["what they want 1", "what they want 2", "what they want 3"],
    "unique_selling_points": ["USP 1", "USP 2", "USP 3"],
    "competitors": ["competitor 1", "competitor 2"],
    "recommended_tone": "specific tone description",
    "emotional_triggers": ["trigger 1", "trigger 2", "trigger 3"]
  },
  "ads": [
    {
      "variant_name": "descriptive name for this variant",
      "variant_angle": "what angle/hook type this uses (e.g. 'pain point', 'social proof', 'curiosity')",
      "headline": "scroll-stopping headline under 80 chars",
      "body_text": "compelling body copy",
      "call_to_action": "action-oriented CTA",
      "hashtags": ["relevant", "hashtags", "max5"],
      "image_prompt": "extremely detailed image generation prompt with subject, setting, lighting, mood, camera angle, style, brand colors",
      "video_script": "natural spoken-word script with pauses and emotion, 15-30 seconds",
      "script_framework": "AIDA",
      "hook_type": "question|bold_claim|story|statistic|controversy|pov|social_proof|curiosity_gap",
      "recommended_music_genre": "specific genre",
      "recommended_music_mood": "specific mood",
      "platform_specific": {
        "instagram": { "caption": "IG-optimized caption with emojis and hashtags", "aspect_ratio": "1:1" },
        "facebook": { "caption": "FB-optimized caption, longer form", "aspect_ratio": "16:9" },
        "tiktok": { "caption": "TikTok-native caption with trending language", "aspect_ratio": "9:16" },
        "whatsapp": { "caption": "personal, direct message style", "aspect_ratio": "9:16" }
      },
      "predicted_score": 78,
      "score_breakdown": {
        "hook_strength": 16,
        "emotional_pull": 14,
        "clarity": 18,
        "cta_urgency": 15,
        "platform_fit": 15
      },
      "score_reasoning": "detailed explanation of why this score",
      "improvement_tips": ["specific tip 1", "specific tip 2"]
    }
  ],
  "recommended_posting_times": {
    "best_days": ["Tuesday", "Thursday"],
    "best_hours": ["9am EST", "7pm EST"],
    "reasoning": "why these times work for this audience"
  },
  "campaign_strategy": "2-3 sentences on overall strategy",
  "ab_test_plan": "specific plan for testing these variants against each other"
}`;

  // Use the AI abstraction layer (Gemini free or Claude premium)
  const { generateText } = await import("@/lib/ai");

  let raw: string;
  try {
    raw = await generateText({
      system: buildSystemPrompt(language),
      prompt: userPrompt,
      maxTokens: 8000,
    });
  } catch {
    // Fallback: try direct Claude if abstraction fails
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system: buildSystemPrompt(language),
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text response");
    raw = textBlock.text.trim();
  }

  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(raw) as CampaignGenerationResult;
  } catch (err) {
    throw new Error(`Failed to parse Claude response as JSON: ${(err as Error).message}`);
  }
}
