# AdGenAI — Full Claude Code Build Prompt

> Copy and paste this entire prompt into Claude Code to build the app.

---

## PROMPT START

You are building **AdGenAI** — an AI-powered ad creation, scheduling, and auto-posting platform. This is a full-stack web application (mobile-responsive, PWA-ready) that lets anyone — even people with zero marketing knowledge — type in their business type and get professional video ads, image ads, ad copy, and music, then schedule and auto-post them to any social platform.

This app is inspired by competitors like Creatify ($9M ARR, 1M+ users), AdCreative.ai, Zeely, Predis.ai, and QuickAds — but it fills critical gaps they all miss. Study the competitive gaps below carefully and build accordingly.

---

## WHAT COMPETITORS DO (copy these proven patterns)

1. **URL-to-Ad Pipeline** (from Creatify): User pastes a product/business URL → app scrapes images, descriptions, brand colors → generates multiple ad variants automatically.
2. **AI Avatar Presenters** (from Creatify/Zeely): AI-generated spokesperson videos with lip-synced voiceover in multiple languages.
3. **Creative Scoring** (from AdCreative.ai): Each generated ad gets a performance prediction score so users know which ad to run.
4. **Template Library** (from QuickAds/Predis): Pre-built, proven ad templates categorized by industry, platform, and goal.
5. **Multi-format Output** (from QuickAds): One ad auto-resized for Instagram Story, Facebook Feed, TikTok, YouTube Shorts, X/Twitter, etc.
6. **Competitor Ad Spy** (from AdCreative.ai/Creatify): Browse what competitor ads are performing well for inspiration.
7. **Script Generation with Proven Frameworks** (from Zeely): Auto-generate scripts using AIDA, PAS, Before-After-Bridge, 4U, FAB frameworks.
8. **Product-Led Growth** (from Creatify): Free tier with self-serve onboarding. Users generate ads immediately after signup. No sales calls needed.
9. **Affiliate Program** (from AdCreative.ai): 30% recurring commission for referrals — this drove massive organic growth.

---

## WHAT COMPETITORS ARE MISSING (build these as your competitive edge)

1. **True Zero-Knowledge Mode**: Competitors still require marketing knowledge (choosing templates, writing hooks, picking frameworks). AdGenAI should have a "Just Do It" mode — user types "I sell shoes in Lagos" and gets complete, ready-to-post ads with zero decisions needed.
2. **Emerging Market Focus**: No competitor targets Africa, Southeast Asia, or Latin America. Support local languages (Pidgin English, Yoruba, Swahili, Hausa, French, Portuguese), local music styles (Afrobeats, Amapiano, Highlife for background tracks), and local platforms (WhatsApp Business, WhatsApp Status ads, Jumia integration).
3. **Full Auto-Post Pipeline**: Most competitors create ads but DON'T post them. AdCreative.ai only integrates with Facebook Ads and Google Ads — no TikTok, no LinkedIn, no Pinterest, no Snapchat, no WhatsApp. AdGenAI handles the ENTIRE pipeline: create → schedule → auto-post → track performance.
4. **Affordable Pricing for SMBs**: Competitors charge $79-$599/month. Build a tier at $5-$15/month targeting small businesses in developing economies.
5. **Credits That Don't Expire**: AdCreative.ai credits expire monthly (users hate this). AdGenAI credits roll over.
6. **WhatsApp Integration**: No competitor does this. Allow users to generate and blast ads via WhatsApp Business API and WhatsApp Status.
7. **Music That Matches the Market**: Competitors use generic stock music. AdGenAI should offer region-specific, trending music categories.
8. **Ad Performance Dashboard with ROI Calculator**: Show users exactly how much money their ads made vs. what they spent, in simple language (not marketing jargon).
9. **Community Marketplace**: Let users share and sell their best-performing ad templates to other users.

---

## TECH STACK

```
Frontend:        Next.js 14+ (App Router) with TypeScript
Styling:         Tailwind CSS + Framer Motion for animations
UI Components:   shadcn/ui
State:           Zustand
Auth:            NextAuth.js (Google, Email, Phone OTP for Africa)
Backend:         Next.js API Routes + tRPC
Database:        PostgreSQL (via Prisma ORM)
File Storage:    AWS S3 or Cloudflare R2
Queue/Jobs:      BullMQ with Redis (for scheduled posting)
AI - Copy:       Anthropic Claude API (ad copy, scripts, prompts)
AI - Images:     Stability AI API or Replicate (for image generation)
AI - Video:      FFmpeg (server-side video assembly)
AI - Music:      Royalty-free music library (Pixabay API or similar)
Payments:        Stripe + Paystack (for African markets)
Social APIs:     Meta Marketing API, TikTok Ads API, Google Ads API, X API, LinkedIn API
PWA:             next-pwa for mobile app experience
Deployment:      Vercel (frontend) + Railway or Fly.io (backend workers)
```

---

## DATABASE SCHEMA (Prisma)

Design these models:

```prisma
model User {
  id              String    @id @default(cuid())
  email           String?   @unique
  phone           String?   @unique
  name            String?
  avatar          String?
  plan            Plan      @default(FREE)
  credits         Int       @default(5)
  creditsExpiry   DateTime? // null = never expires
  businessName    String?
  businessType    String?
  businessUrl     String?
  brandColors     Json?     // {primary, secondary, accent}
  brandLogo       String?
  country         String?
  language        String    @default("en")
  currency        String    @default("USD")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  ads             Ad[]
  campaigns       Campaign[]
  socialAccounts  SocialAccount[]
  templates       Template[]
  transactions    Transaction[]
  referrals       Referral[]
  referredBy      String?
}

enum Plan {
  FREE        // 5 ads/month, watermark
  STARTER     // $5/month, 20 ads, no watermark
  PRO         // $15/month, 100 ads, all features
  BUSINESS    // $49/month, unlimited, API access
  ENTERPRISE  // custom pricing
}

model Ad {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  type            AdType    // IMAGE, VIDEO, CAROUSEL, STORY
  platform        Platform[] // multi-platform targeting
  status          AdStatus  @default(DRAFT)
  
  // Generated content
  headline        String?
  bodyText        String?
  callToAction    String?
  script          String?   // for video ads
  scriptFramework String?   // AIDA, PAS, etc.
  
  // Media
  images          Json?     // array of image URLs
  videoUrl        String?
  thumbnailUrl    String?
  musicTrack      String?
  musicGenre      String?   // afrobeats, pop, corporate, etc.
  voiceoverUrl    String?
  
  // Metadata
  aspectRatio     String    @default("1:1")
  duration        Int?      // seconds for video
  language        String    @default("en")
  score           Float?    // AI performance prediction 0-100
  
  // Scheduling
  scheduledAt     DateTime?
  postedAt        DateTime?
  
  // Performance tracking
  impressions     Int       @default(0)
  clicks          Int       @default(0)
  conversions     Int       @default(0)
  spend           Float     @default(0)
  revenue         Float     @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  campaign        Campaign? @relation(fields: [campaignId], references: [id])
  campaignId      String?
}

enum AdType {
  IMAGE
  VIDEO
  CAROUSEL
  STORY
  REEL
  WHATSAPP_STATUS
}

enum Platform {
  FACEBOOK
  INSTAGRAM
  TIKTOK
  YOUTUBE
  X_TWITTER
  LINKEDIN
  SNAPCHAT
  WHATSAPP
  PINTEREST
  GOOGLE_ADS
}

enum AdStatus {
  DRAFT
  GENERATING
  READY
  SCHEDULED
  POSTING
  POSTED
  FAILED
  PAUSED
}

model Campaign {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  name            String
  objective       String?   // awareness, traffic, conversions, sales
  budget          Float?
  startDate       DateTime?
  endDate         DateTime?
  status          String    @default("draft")
  ads             Ad[]
  createdAt       DateTime  @default(now())
}

model SocialAccount {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  platform        Platform
  accountId       String
  accountName     String?
  accessToken     String
  refreshToken    String?
  tokenExpiry     DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
}

model Template {
  id              String    @id @default(cuid())
  name            String
  description     String?
  category        String    // restaurant, fashion, tech, real-estate, etc.
  platform        Platform[]
  adType          AdType
  thumbnailUrl    String?
  config          Json      // template configuration
  isPublic        Boolean   @default(false)
  isPremium       Boolean   @default(false)
  price           Float?    // for marketplace
  usageCount      Int       @default(0)
  rating          Float     @default(0)
  
  creatorId       String?
  creator         User?     @relation(fields: [creatorId], references: [id])
  createdAt       DateTime  @default(now())
}

model Transaction {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  type            String    // subscription, credits, template_purchase
  amount          Float
  currency        String
  status          String    // pending, completed, failed
  provider        String    // stripe, paystack
  providerId      String?
  createdAt       DateTime  @default(now())
}

model Referral {
  id              String    @id @default(cuid())
  referrerId      String
  referrer        User      @relation(fields: [referrerId], references: [id])
  referredEmail   String?
  referredPhone   String?
  status          String    @default("pending") // pending, signed_up, converted
  commission      Float     @default(0)
  createdAt       DateTime  @default(now())
}

model MusicTrack {
  id              String    @id @default(cuid())
  title           String
  artist          String?
  genre           String    // afrobeats, amapiano, pop, corporate, cinematic, etc.
  mood            String    // energetic, calm, inspiring, funny, dramatic
  duration        Int       // seconds
  url             String
  region          String?   // nigeria, global, kenya, south-africa, etc.
  isRoyaltyFree   Boolean   @default(true)
  usageCount      Int       @default(0)
}
```

---

## APP STRUCTURE & PAGES

```
/                           → Landing page (conversion-optimized)
/auth/login                 → Login (email, Google, phone OTP)
/auth/signup                → Signup with referral code support
/dashboard                  → Main dashboard (recent ads, stats, quick actions)
/create                     → Ad creation wizard (the core product)
/create/magic               → "Just Do It" zero-knowledge mode
/create/advanced             → Advanced mode with template selection
/ads                        → All my ads (grid view with status badges)
/ads/[id]                   → Single ad detail (preview, edit, schedule, post)
/campaigns                  → Campaign manager
/campaigns/[id]             → Campaign detail with all ads
/schedule                   → Calendar view of scheduled posts
/analytics                  → Performance dashboard with ROI calculator
/templates                  → Template browser (by industry, platform)
/marketplace                → Community template marketplace
/connect                    → Connect social accounts (OAuth flows)
/settings                   → Account, billing, brand kit, preferences
/settings/billing           → Plan management, credit balance, transactions
/settings/brand             → Brand colors, logo, fonts, voice/tone
/referral                   → Referral dashboard with tracking link
/api/...                    → All API routes
```

---

## CORE FEATURE: AD CREATION WIZARD

This is the heart of the app. Build TWO modes:

### Mode 1: "Magic Mode" (Zero-Knowledge) — THE DIFFERENTIATOR

```
Step 1: "What's your business?"
         → Single text input: "I sell ankara fabric in Benin City"
         → OR paste a business URL
         
Step 2: "Where do you want to advertise?"
         → Checkboxes: Instagram, Facebook, TikTok, WhatsApp, etc.
         → Smart default based on user's country
         
Step 3: "When should we post?"
         → Date picker + time picker
         → "Post now" option
         → "Let AI pick the best time" option
         
Step 4: DONE. AI handles EVERYTHING:
         → Analyzes the business type
         → Generates multiple ad copy variants (3-5 options)
         → Creates image prompts and generates images
         → Assembles video with music (if video selected)
         → Picks the right aspect ratio per platform
         → Scores each variant
         → Schedules posting
```

The Claude API prompt for Magic Mode should be:

```
System: You are an expert advertising creative director with 20 years of experience 
creating high-converting ads for businesses of all sizes across Africa, Europe, 
and the Americas. You understand local markets, cultural nuances, and what makes 
people click, buy, and share.

User: Create a complete ad campaign for this business: "{user_input}"

Target platforms: {selected_platforms}
Country/Region: {user_country}
Language: {user_language}

Generate the following as a JSON response:
{
  "business_analysis": {
    "industry": "string",
    "target_audience": "string", 
    "unique_selling_points": ["string"],
    "competitors": ["string"],
    "recommended_tone": "string"
  },
  "ads": [
    {
      "variant_name": "string",
      "headline": "string (max 40 chars)",
      "body_text": "string (max 125 chars for feed, 90 for story)",
      "call_to_action": "string",
      "hashtags": ["string"],
      "image_prompt": "string (detailed prompt for image generation)",
      "video_script": "string (15-30 second script if video)",
      "script_framework": "AIDA|PAS|BAB|4U|FAB",
      "recommended_music_genre": "string",
      "recommended_music_mood": "string",
      "platform_specific": {
        "instagram": { "caption": "string", "aspect_ratio": "1:1" },
        "facebook": { "caption": "string", "aspect_ratio": "16:9" },
        "tiktok": { "caption": "string", "aspect_ratio": "9:16" },
        "whatsapp": { "caption": "string", "aspect_ratio": "9:16" }
      },
      "predicted_score": 0-100,
      "score_reasoning": "string"
    }
  ],
  "recommended_posting_times": {
    "best_days": ["string"],
    "best_hours": ["string"],
    "reasoning": "string"
  },
  "campaign_strategy": "string (2-3 sentences on how to maximize results)"
}
```

### Mode 2: "Advanced Mode"

Full control with template selection, manual script editing, custom image upload, music selection, etc.

---

## CORE FEATURE: VIDEO ASSEMBLY ENGINE

Build a server-side video assembly pipeline using FFmpeg:

```
Input:  Generated images + music track + voiceover text + branding
Output: Platform-ready video (MP4) in multiple aspect ratios

Pipeline:
1. Take 3-5 generated images
2. Apply Ken Burns effect (subtle zoom/pan) to each image (3-5 seconds each)
3. Add text overlays (headline, CTA) with animations (fade in/slide up)
4. Add brand logo watermark (bottom corner)
5. Layer background music track (auto-fade at end)
6. Generate TTS voiceover if requested (use a TTS API)
7. Export in multiple aspect ratios: 1:1, 9:16, 16:9, 4:5
8. Add subtitles/captions burned into video
```

FFmpeg command structure to implement:
```bash
ffmpeg -loop 1 -t 5 -i image1.jpg -loop 1 -t 5 -i image2.jpg \
  -i music.mp3 -filter_complex \
  "[0:v]zoompan=z='min(zoom+0.001,1.5)':d=150:s=1080x1080[v0]; \
   [1:v]zoompan=z='min(zoom+0.001,1.5)':d=150:s=1080x1080[v1]; \
   [v0][v1]concat=n=2:v=1:a=0[outv]; \
   [outv]drawtext=text='Your Headline':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100[final]" \
  -map "[final]" -map 2:a -shortest -c:v libx264 -c:a aac output.mp4
```

---

## CORE FEATURE: AUTO-POSTING ENGINE

Build a BullMQ job queue that:

1. Picks up scheduled ads from the database
2. At the scheduled time, authenticates with the target platform's API
3. Uploads the media (image/video)
4. Posts with the generated caption, hashtags, and CTA
5. Records the post ID and URL back to the database
6. Starts polling for performance metrics (impressions, clicks, etc.)
7. Handles failures with retry logic (max 3 retries with exponential backoff)

Implement OAuth2 flows for each platform:
- **Meta (FB/IG)**: Facebook Marketing API — Pages publish, Instagram Content Publishing
- **TikTok**: TikTok for Developers — Content Posting API  
- **X/Twitter**: Twitter API v2 — Tweet creation with media
- **LinkedIn**: LinkedIn Marketing API — UGC Posts
- **WhatsApp**: WhatsApp Business Cloud API — Message templates + Status

---

## CORE FEATURE: ANALYTICS DASHBOARD

Build a clean, visual dashboard showing:

```
┌─────────────────────────────────────────────┐
│  Total Ads Created: 47    Active Campaigns: 3│
│  Credits Remaining: 23    Plan: Pro          │
├─────────────────────────────────────────────┤
│                                             │
│  📈 Performance Overview (Line Chart)        │
│  - Impressions over time                    │
│  - Clicks over time                         │
│  - Conversions over time                    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  💰 ROI Calculator                           │
│  Money Spent on Ads:    ₦15,000             │
│  Revenue from Ads:      ₦89,000             │
│  Return on Investment:  493% 🟢             │
│  "For every ₦1 you spent, you made ₦5.93"  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🏆 Best Performing Ads (Grid)               │
│  [Ad 1 - Score 94] [Ad 2 - Score 87]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Platform Breakdown (Bar Chart)           │
│  Instagram: 45% of engagement               │
│  Facebook:  30% of engagement               │
│  TikTok:    20% of engagement               │
│  WhatsApp:   5% of engagement               │
│                                             │
└─────────────────────────────────────────────┘
```

Use Recharts for all charts. Show data in the user's local currency.

---

## CORE FEATURE: REFERRAL SYSTEM

```
- Each user gets a unique referral link: adgenai.com/r/USERNAME
- Referred user gets 5 extra free credits
- Referrer gets 30% recurring commission on referred user's subscription
- Referral dashboard shows: link, clicks, signups, conversions, earnings
- Payout via Paystack (for African users) or Stripe
```

---

## LANDING PAGE

Build a high-converting landing page with:

1. **Hero Section**: "Create Professional Ads in 30 Seconds. No Marketing Degree Needed."
   - Subtext: "Type your business. Get video ads, image ads, and copy. Post everywhere. Automatically."
   - CTA: "Create Your First Ad Free →"
   - Animated demo showing the magic mode in action

2. **Social Proof**: "Trusted by 10,000+ businesses across Africa and beyond"
   - Logo bar of sample businesses
   - Testimonial cards

3. **How It Works**: 3 steps with animations
   - Step 1: Describe your business
   - Step 2: AI creates your ads
   - Step 3: We post them for you

4. **Feature Grid**: All major features with icons

5. **Pricing Section**: 4 tiers (Free, Starter, Pro, Business)
   - Toggle between USD and local currencies (NGN, KES, GHS, ZAR)
   - Highlight the Pro plan as "Most Popular"

6. **FAQ Section**: Accordion style

7. **Footer**: Links, social media, "Made with ❤️ in Africa"

---

## DESIGN SYSTEM

```css
/* Brand Colors — warm, African-inspired palette */
--primary: #FF6B35;       /* Vibrant orange — energy, creativity */
--primary-dark: #E55A2B;
--secondary: #004E89;     /* Deep blue — trust, technology */
--accent: #2EC4B6;        /* Teal — freshness, growth */
--success: #2ECC71;
--warning: #F39C12;
--danger: #E74C3C;
--bg-primary: #FAFAFA;
--bg-secondary: #F0F4F8;
--bg-dark: #1A1A2E;       /* Dark mode background */
--text-primary: #1A1A2E;
--text-secondary: #6B7280;
--text-light: #F8F9FA;

/* Typography */
Font heading: "Plus Jakarta Sans" (Google Fonts) — bold, modern, warm
Font body: "DM Sans" (Google Fonts) — clean, readable
Font mono: "JetBrains Mono" — for code/data

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 12px rgba(0,0,0,0.1);
--shadow-lg: 0 12px 36px rgba(0,0,0,0.15);
```

---

## IMPLEMENTATION ORDER

Build in this exact order:

### Phase 1: Foundation
1. Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui
2. Set up Prisma with PostgreSQL schema
3. Implement NextAuth (email + Google + phone OTP)
4. Build the landing page
5. Build the dashboard layout (sidebar + topbar + content area)

### Phase 2: Core Product
6. Build the Ad Creation Wizard — Magic Mode
7. Integrate Claude API for ad copy/script generation
8. Build image generation integration (Stability AI or Replicate)
9. Build the video assembly engine with FFmpeg
10. Build the ad preview component (shows how ad looks on each platform)
11. Build the ads gallery page (all user's ads with filters)

### Phase 3: Scheduling & Posting
12. Set up Redis + BullMQ for job queue
13. Build the scheduling UI (calendar view + date/time picker)
14. Implement Meta OAuth + Facebook/Instagram posting
15. Implement TikTok OAuth + posting
16. Implement X/Twitter OAuth + posting
17. Build the social accounts connection page

### Phase 4: Analytics & Growth
18. Build the analytics dashboard with Recharts
19. Build the ROI calculator
20. Implement the referral system
21. Set up Stripe + Paystack payment integration
22. Build the pricing/billing page
23. Build the template marketplace

### Phase 5: Polish
24. Add Framer Motion animations throughout
25. Implement PWA (service worker, manifest, offline support)
26. Add dark mode toggle
27. Add multi-language support (i18n for English, Pidgin, French, Yoruba)
28. Performance optimization (lazy loading, image optimization, caching)
29. Error handling, loading states, empty states everywhere

---

## IMPORTANT RULES

1. **Every page must have loading states, error states, and empty states.** Never show a blank screen.
2. **Mobile-first design.** Most users in Africa access via mobile. Test every component at 375px width.
3. **Credits system must be enforced.** Check credits before every ad generation. Deduct after successful generation.
4. **All API keys must be in environment variables.** Never hardcode secrets.
5. **Use optimistic UI updates** where possible for snappy feel.
6. **All forms must have validation** with clear error messages.
7. **Toast notifications** for all user actions (success, error, info).
8. **Rate limiting** on all API routes (use upstash/ratelimit).
9. **File uploads** must validate type and size (max 10MB images, 100MB video).
10. **SEO optimized** — proper meta tags, Open Graph, Twitter cards on all public pages.

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=
STABILITY_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Social APIs
META_APP_ID=
META_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
WHATSAPP_BUSINESS_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# Queue
REDIS_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## START BUILDING NOW

Begin with Phase 1, Step 1. Initialize the project, install all dependencies, set up the folder structure, and get the landing page live. After each phase, ask me to review before moving to the next.

Let's build something that makes advertising accessible to every small business owner in Africa and beyond.

## PROMPT END
