"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I need any marketing knowledge to use AdGenAI?",
    a: "No. Our Magic Mode is built for people with zero marketing experience. Type your business in one sentence, and our AI handles everything — copy, images, video, scheduling, and posting.",
  },
  {
    q: "Which social platforms do you post to?",
    a: "Instagram, Facebook, TikTok, YouTube Shorts, X/Twitter, LinkedIn, Pinterest, Snapchat, and WhatsApp (Business API + Status). We're the only platform that posts to WhatsApp automatically.",
  },
  {
    q: "Do credits expire?",
    a: "Never. Unlike competitors who force you to use credits monthly, your AdGenAI credits roll over indefinitely. Use them when you need them.",
  },
  {
    q: "What languages do you support?",
    a: "30+ languages including English, Spanish, French, German, Portuguese, Italian, Dutch, Hindi, Arabic, Japanese, Korean, Swahili, and more. We add new languages every month.",
  },
  {
    q: "Can I use my own images and videos?",
    a: "Yes. Use our AI-generated content, upload your own, or mix both. You can also paste a product URL and we'll scrape images automatically.",
  },
  {
    q: "How does the ROI calculator work?",
    a: "We pull ad spend and conversion data directly from connected platforms and compare it to revenue you've tagged. You see a simple number: for every $1 spent, you made $X.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. You get 5 free ads per month forever. No credit card required. Upgrade only when you need more.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit/debit cards (Visa, Mastercard, Amex) worldwide via Stripe, plus bank transfer, USSD, and mobile money via Paystack for customers in Africa. All plans available in USD, EUR, GBP, and 20+ local currencies.",
  },
  {
    q: "Can I switch between monthly and yearly billing?",
    a: "Yes, anytime. Yearly plans save you 20% — if you switch from monthly to yearly mid-cycle, we prorate the remaining balance.",
  },
  {
    q: "How is this different from Creatify or AdCreative.ai?",
    a: "Three things: (1) true zero-knowledge mode — no marketing decisions needed, (2) we auto-post to every platform including WhatsApp, (3) we start at $49/month with 100 credits that roll over.",
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
