export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Describe your business",
      description: "Type one sentence. Or paste your website URL. Our AI figures out the rest — your industry, audience, tone, and competitors worldwide.",
      color: "from-primary to-warning",
    },
    {
      number: "02",
      title: "AI creates your ads",
      description: "Claude generates copy in 5 proven frameworks. Stable Diffusion generates images. FFmpeg assembles videos with music. All in 30 seconds.",
      color: "from-secondary to-accent",
    },
    {
      number: "03",
      title: "We post them for you",
      description: "Connect your socials once. Schedule or post now. We handle Instagram, Facebook, TikTok, WhatsApp, X, LinkedIn — and track performance.",
      color: "from-accent to-primary",
    },
  ];

  return (
    <section id="how-it-works" className="bg-gradient-to-b from-white to-bg-secondary/50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            How it works
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            From idea to published ad in 30 seconds
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.number} className="relative">
              <div className={`mb-6 inline-block bg-gradient-to-br ${s.color} bg-clip-text font-heading text-7xl font-extrabold text-transparent`}>
                {s.number}
              </div>
              <h3 className="font-heading text-2xl font-bold text-text-primary mb-3">{s.title}</h3>
              <p className="text-text-secondary leading-relaxed text-lg">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
