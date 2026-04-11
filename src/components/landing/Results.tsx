import { TrendingUp, Globe, Users, Zap } from "lucide-react";

const metrics = [
  {
    value: "1B+",
    label: "Ad impressions generated",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    value: "50,000+",
    label: "Ads created by businesses",
    icon: Zap,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    value: "10,000+",
    label: "Active businesses worldwide",
    icon: Users,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    value: "40+",
    label: "Countries and counting",
    icon: Globe,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

export function Results() {
  return (
    <section className="px-6 py-24 bg-gradient-to-b from-bg-secondary/30 to-white">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded-full bg-success/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-success mb-4">
            Results
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            Trusted by businesses everywhere
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            From solo entrepreneurs to growing brands, Famousli powers ad creation at scale.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${m.bgColor}`}>
                <m.icon className={`h-6 w-6 ${m.color}`} />
              </div>
              <div className={`font-heading text-4xl font-extrabold ${m.color} mb-2`}>
                {m.value}
              </div>
              <div className="text-sm text-text-secondary">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
