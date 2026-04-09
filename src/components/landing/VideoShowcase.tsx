import { Play } from "lucide-react";

const videos = [
  {
    title: "UGC Testimonial",
    description: "Authentic customer stories that build trust and drive conversions",
    gradient: "from-primary/70 via-accent/60 to-warning/50",
  },
  {
    title: "Product Demo",
    description: "Showcase your product features in a sleek, scroll-stopping format",
    gradient: "from-secondary/70 via-primary/60 to-accent/50",
  },
  {
    title: "Before & After",
    description: "Dramatic transformation ads that highlight real results",
    gradient: "from-accent/70 via-warning/60 to-primary/50",
  },
  {
    title: "Story Ad",
    description: "Vertical-first story ads optimized for Instagram and TikTok",
    gradient: "from-warning/70 via-primary/60 to-secondary/50",
  },
];

export function VideoShowcase() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
            Video Showcase
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            Every ad format, one platform
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Generate UGC-style testimonials, product demos, transformation ads, and vertical story ads — all powered by AI.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((v) => (
            <div
              key={v.title}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`relative aspect-[9/16] bg-gradient-to-br ${v.gradient}`}>
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 text-white ml-1" fill="white" />
                  </div>
                </div>
                {/* Bottom text overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <div className="font-heading text-base font-bold text-white">{v.title}</div>
                  <div className="text-xs text-white/80 mt-1 leading-relaxed">{v.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
