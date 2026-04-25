export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Pick your actor & write the script",
      description: "Filter 100+ AI actors by gender, age, vibe, setting. Or upload your own photo. Write your script — or have AI generate one in your brand voice.",
      color: "from-primary to-warning",
    },
    {
      number: "02",
      title: "Upload your product, AI does the rest",
      description: "Add product photos. Nano Banana composites your actor with your product. Kling 2.6 Pro renders cinematic video. Voiceover and lip-sync are auto-generated.",
      color: "from-secondary to-accent",
    },
    {
      number: "03",
      title: "Review, edit, download",
      description: "Preview each scene in Studio. Don't like one? Type \"make her smile more\" — AI re-renders just that scene. Hit download. Post wherever you want.",
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
            From product photo to finished UGC ad
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
