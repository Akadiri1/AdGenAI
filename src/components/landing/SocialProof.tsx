export function SocialProof() {
  const testimonials = [
    {
      name: "Sophie Laurent",
      role: "Boutique Owner, Paris",
      quote: "I used to pay €200 per ad to a designer. Now I make 10 ads a week for free. My Instagram sales tripled.",
    },
    {
      name: "Marcus Chen",
      role: "Café Owner, San Francisco",
      quote: "The performance scoring is genius. I only run the winners now — my ad spend dropped 40%.",
    },
    {
      name: "Priya Sharma",
      role: "E-commerce, Mumbai",
      quote: "Auto-posting to WhatsApp Status is magic. I reach 2,000 contacts without lifting a finger.",
    },
  ];

  return (
    <section className="border-y border-black/5 bg-bg-secondary/30 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Trusted by 10,000+ businesses in 40+ countries
        </p>

        <div className="mt-8 grid grid-cols-2 items-center gap-8 md:grid-cols-6">
          {["Vercel", "Stripe", "OpenAI", "Notion", "Figma", "Slack"].map((brand) => (
            <div
              key={brand}
              className="flex items-center justify-center opacity-40 transition-opacity hover:opacity-70"
            >
              <span className="font-heading text-xl font-bold text-text-primary">{brand}</span>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4 text-warning">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-text-primary leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="font-heading font-bold text-text-primary">{t.name}</div>
                <div className="text-sm text-text-secondary">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
