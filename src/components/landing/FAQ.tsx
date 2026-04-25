"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What does Famousli actually do?",
    a: "We generate UGC-style video ads for ecommerce sellers. Pick an AI actor, upload your product, write or AI-generate a script — we composite the actor with your product, render a Kling video, add voiceover and lip-sync, and give you a downloadable MP4. You post it yourself wherever you want.",
  },
  {
    q: "Do you publish to social platforms for me?",
    a: "Not yet. We give you the finished MP4 — you post it on Instagram, TikTok, etc. Auto-posting is on the roadmap but not built. We didn't want to claim something we don't have.",
  },
  {
    q: "Do credits expire?",
    a: "Credits roll over month-to-month up to a cap (twice your monthly allowance). Use them when you need them.",
  },
  {
    q: "What languages do you support?",
    a: "Scripts can be generated in 13+ languages including English, Spanish, French, Portuguese, Hindi, Arabic, Japanese, Korean, Yoruba, Swahili, and more. Voiceover currently uses English voices but other languages render the script as text and you can voice-over yourself.",
  },
  {
    q: "Can I use my own actor (my face)?",
    a: "Yes — Pro and above let you upload a custom photo as your actor. Free and Starter use our 100+ stock AI actors.",
  },
  {
    q: "How long does an ad take to render?",
    a: "A 5-10 second single-shot ad: ~2 minutes. A 30-second multi-scene ad: ~7 minutes. A 60-second ad: ~10 minutes. Most of the wait is on the AI video model (Kling 2.6 Pro on Replicate); we tell you the estimate before you start.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — Free generates AI scripts and scene prompts you can copy into Kling, Veo, Sora, or any other AI video tool. No video rendering on Famousli at the free tier. No credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Cards via Stripe (Visa, Mastercard, Amex) globally, plus bank transfer, USSD, and mobile money via Paystack for customers in Nigeria, Ghana, South Africa, Kenya, Egypt, Rwanda, and Côte d'Ivoire.",
  },
  {
    q: "Can I switch between monthly and yearly billing?",
    a: "Yes, anytime. Yearly plans save 20%. Switching mid-cycle prorates the remaining balance.",
  },
  {
    q: "Do you offer a referral program?",
    a: "Yes — 20% recurring commission on every paying user you refer, for as long as they stay subscribed.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-bg-secondary/30 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-4">
            FAQ
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            Questions? We&apos;ve got answers.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-heading font-semibold text-text-primary">{faq.q}</span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-text-secondary transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-text-secondary leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
