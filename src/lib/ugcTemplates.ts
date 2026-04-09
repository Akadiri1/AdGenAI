/**
 * UGC (User-Generated Content) ad script templates.
 * Proven formats that convert well on social platforms.
 * Users pick a format → AI fills in their product/brand details.
 */

export type UGCTemplate = {
  id: string;
  name: string;
  description: string;
  format: string; // the visual format
  duration: string;
  platforms: string[];
  scriptTemplate: string; // placeholders: {{product}}, {{brand}}, {{benefit}}, {{offer}}
  hookStyle: string;
  bestFor: string;
};

export const UGC_TEMPLATES: UGCTemplate[] = [
  {
    id: "street-interview",
    name: "Street Interview",
    description: "Someone gets asked a question on camera and casually recommends your product",
    format: "Vertical (9:16)",
    duration: "15-30s",
    platforms: ["TikTok", "Reels", "Shorts"],
    hookStyle: "Question hook",
    bestFor: "Awareness, social proof",
    scriptTemplate: `[Interviewer off-camera]: "What's your go-to {{product_category}}?"

[Actor looks at camera naturally]: "Oh, definitely {{brand}}. I've been using it for a while now and honestly, {{benefit_1}}.

The thing is, {{benefit_2}}. And right now they have {{offer}} which is insane.

I'd say just try it. You'll see what I mean."`,
  },
  {
    id: "honest-review",
    name: "Honest Review",
    description: "A real-feeling product review — starts skeptical, ends convinced",
    format: "Vertical (9:16)",
    duration: "20-40s",
    platforms: ["TikTok", "Reels", "YouTube Shorts"],
    hookStyle: "Skepticism hook",
    bestFor: "Conversions, trust building",
    scriptTemplate: `"Okay so I was super skeptical about {{brand}} at first. Like, {{common_objection}}.

But then I actually tried it and... wow. {{benefit_1}}.

What really got me though is {{benefit_2}}. That's when I knew this was different.

If you're on the fence, just go for it. {{offer}}."`,
  },
  {
    id: "problem-solution",
    name: "Problem → Solution",
    description: "Start with a relatable pain point, reveal your product as the fix",
    format: "Vertical (9:16)",
    duration: "15-25s",
    platforms: ["TikTok", "Reels", "Facebook", "Instagram"],
    hookStyle: "Pain point hook",
    bestFor: "Direct response, sales",
    scriptTemplate: `"Does anyone else struggle with {{pain_point}}? Because I used to {{describe_struggle}}.

Then someone told me about {{brand}} and honestly it changed everything.

Now {{benefit_result}}. Like, why didn't I find this sooner?

They're doing {{offer}} right now so definitely check it out."`,
  },
  {
    id: "day-in-life",
    name: "Day in My Life",
    description: "Product naturally woven into a daily routine — feels organic, not salesy",
    format: "Vertical (9:16)",
    duration: "20-30s",
    platforms: ["TikTok", "Reels", "YouTube Shorts"],
    hookStyle: "Lifestyle hook",
    bestFor: "Brand awareness, relatability",
    scriptTemplate: `"POV: my morning routine with {{brand}}.

So first thing I do is {{morning_action}}. Then I grab my {{product}} because {{reason}}.

The thing I love about it is {{benefit_1}}. Plus {{benefit_2}} which is a game changer.

If you want to level up your {{routine_type}}, link is in bio."`,
  },
  {
    id: "unboxing",
    name: "Unboxing / First Impressions",
    description: "Opening the product for the first time — excitement and genuine reactions",
    format: "Vertical (9:16)",
    duration: "20-35s",
    platforms: ["TikTok", "Reels", "YouTube Shorts"],
    hookStyle: "Excitement hook",
    bestFor: "Product launches, hype",
    scriptTemplate: `"Okay my {{brand}} just arrived and I'm so excited to open this.

[Opening package] Oh wow, the packaging alone is... okay this is nice.

So this is the {{product}}. First impression — {{first_reaction}}. And it has {{feature}}.

I'll do a full review after I use it but honestly, first impressions are 10 out of 10. {{offer}}."`,
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Show the transformation — what life was like before vs after your product",
    format: "Vertical (9:16)",
    duration: "15-25s",
    platforms: ["TikTok", "Reels", "Instagram"],
    hookStyle: "Transformation hook",
    bestFor: "Results-driven products",
    scriptTemplate: `"Before {{brand}}: {{before_state}}.

After {{brand}}: {{after_state}}.

I'm not even exaggerating. {{specific_result}}.

If you want the same results, {{offer}}. Trust me on this one."`,
  },
  {
    id: "storytime",
    name: "Storytime",
    description: "Tell a personal story that naturally leads to your product recommendation",
    format: "Vertical (9:16)",
    duration: "30-45s",
    platforms: ["TikTok", "Reels", "YouTube Shorts"],
    hookStyle: "Story hook",
    bestFor: "Emotional connection, virality",
    scriptTemplate: `"Story time. So the other day {{story_setup}}.

And I was like, great, now what? That's when my friend told me about {{brand}}.

At first I thought {{initial_thought}}. But then {{turning_point}}.

Long story short, {{happy_ending}}. Best decision I've made in a while. {{offer}}."`,
  },
  {
    id: "comparison",
    name: "This vs That",
    description: "Compare your product against what people currently use — show why yours wins",
    format: "Vertical (9:16)",
    duration: "20-30s",
    platforms: ["TikTok", "Reels", "YouTube Shorts"],
    hookStyle: "Comparison hook",
    bestFor: "Competitive positioning",
    scriptTemplate: `"I used to use {{competitor_category}} and thought it was fine. Then I tried {{brand}}.

Here's the difference. {{comparison_point_1}}. And {{comparison_point_2}}.

But the biggest thing? {{key_differentiator}}.

I'm never going back. {{offer}}."`,
  },
  {
    id: "hot-take",
    name: "Hot Take / Controversial Opinion",
    description: "Start with a bold statement that stops the scroll — then back it up",
    format: "Vertical (9:16)",
    duration: "15-25s",
    platforms: ["TikTok", "Reels", "X/Twitter"],
    hookStyle: "Controversy hook",
    bestFor: "Engagement, virality, awareness",
    scriptTemplate: `"Unpopular opinion: {{bold_statement}}.

I know, I know, but hear me out. {{reasoning}}.

Ever since I switched to {{brand}}, {{positive_result}}.

Don't knock it till you try it. {{offer}}."`,
  },
];
