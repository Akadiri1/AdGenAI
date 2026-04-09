import Link from "next/link";

export function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl gradient-bg animate-gradient p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-extrabold text-white md:text-5xl">
              Ready to stop wasting money on ads?
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
              Join 10,000+ businesses creating professional ads in 30 seconds. Free forever plan. No credit card required.
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Create your first ad free
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
