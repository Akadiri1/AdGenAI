import {
  Sparkles, Film, FileText, Globe, Music, CalendarDays,
  MessageSquare, DollarSign, Trophy, type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Magic Mode",
    description: "Type your business. Get ready-to-post ads. Zero decisions required.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Film,
    title: "AI Video Ads",
    description: "Images + music + voiceover + animations assembled automatically in 6s, 15s, 30s, or 60s formats.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: FileText,
    title: "Copy That Converts",
    description: "AIDA, PAS, Before-After-Bridge frameworks built in. AI scores every ad and tells you why.",
    color: "text-warning bg-warning/10",
  },
  {
    icon: Globe,
    title: "30+ Languages",
    description: "English, Spanish, French, Portuguese, German, Hindi, Arabic, Japanese, and more.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: Music,
    title: "Global Music Library",
    description: "Pop, cinematic, hip-hop, lo-fi, Afrobeats, amapiano, and regional tracks worldwide.",
    color: "text-danger bg-danger/10",
  },
  {
    icon: CalendarDays,
    title: "Auto-Schedule & Post",
    description: "Set it and forget it. Post to Instagram, Facebook, TikTok, WhatsApp, and more at the perfect time.",
    color: "text-success bg-success/10",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integration",
    description: "Send ads via WhatsApp Status and Business API. No other platform does this.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: DollarSign,
    title: "ROI Calculator",
    description: "Know exactly how much money each ad made on each platform. In plain numbers.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: Trophy,
    title: "Performance Scoring",
    description: "Every ad gets a predicted score with 5-point breakdown. Run only the winners.",
    color: "text-warning bg-warning/10",
  },
];

export function Features() {
  return (
    <section id="features" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <div className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-4">
            Everything you need
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            One app. The whole ad pipeline.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary">
            Competitors give you a creator. We give you creation, scheduling, posting, and analytics — automatically.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/20"
              >
                <div className={`mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
