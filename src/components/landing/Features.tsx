import {
  Sparkles, Film, FileText, Globe, Users, Mic,
  Image as ImageIcon, Wand2, Download, type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

const features: Feature[] = [
  {
    icon: Users,
    title: "100+ AI Actors",
    description: "Pick a face that fits your audience — diverse genders, ages, settings. Filter by vibe.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: ImageIcon,
    title: "Actor + Product Compositing",
    description: "Upload your product. Nano Banana puts your actor holding it, using it, in any setting — automatically.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: Film,
    title: "Kling 2.6 Pro Video",
    description: "5–60 second videos with cinematic motion. Single shot or multi-scene cuts — you choose.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: FileText,
    title: "AI Scriptwriter",
    description: "Write your own script or have AI generate a UGC-style hook + body + CTA in your brand voice.",
    color: "text-warning bg-warning/10",
  },
  {
    icon: Mic,
    title: "Voiceover + Lip-Sync",
    description: "Auto-generated voiceover synced to your actor's mouth. No recording yourself.",
    color: "text-danger bg-danger/10",
  },
  {
    icon: Wand2,
    title: "Edit With Plain English",
    description: "Don't like a scene? Type \"make her smile more\" or \"brighter lighting\". AI re-renders just that scene.",
    color: "text-success bg-success/10",
  },
  {
    icon: Globe,
    title: "13+ Languages",
    description: "Generate scripts in English, Spanish, French, Portuguese, Hindi, Arabic, Yoruba, Swahili, and more.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "Free Prompts Forever",
    description: "Free plan generates copy-paste prompts for Kling, Veo, Sora — even if you never pay.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: Download,
    title: "Download as MP4",
    description: "Final video stitched, lip-synced, ready. Download and post anywhere — no platform lock-in.",
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
            Your face, your product, ready to ship.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary">
            Pick an actor. Upload your product. Get a finished UGC video — voiceover, lip-sync, the works. Download and post.
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
