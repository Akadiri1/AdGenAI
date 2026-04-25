import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CONTACT } from "@/lib/contact";

export function Footer() {
  const year = new Date().getFullYear();
  const links = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
    "Free Tools": [
      { label: "Hook Generator", href: "/tools/hook-generator" },
      { label: "Sign up free", href: "/auth/signup" },
      { label: "Sign in", href: "/auth/login" },
    ],
    Contact: [
      { label: `Email: ${CONTACT.supportEmail}`, href: `mailto:${CONTACT.supportEmail}` },
      { label: `WhatsApp ${CONTACT.whatsappDisplay}`, href: CONTACT.whatsappLink },
      { label: "TikTok @famouslihq", href: CONTACT.tiktokLink },
      { label: "Instagram @famouslihq", href: CONTACT.instagramLink },
      { label: "YouTube @famouslihq", href: CONTACT.youtubeLink },
    ],
    Legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund Policy", href: "/terms#refunds" },
    ],
  };

  return (
    <footer className="border-t border-black/5 bg-white dark:bg-bg-dark px-4 sm:px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-4">
              AI-powered ad creation for every small business. From New York to Nairobi, Paris to Mumbai.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Start free →
            </Link>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-heading font-bold text-text-primary mb-4">{section}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/5 dark:border-white/10 pt-6 sm:pt-8 md:flex-row text-center md:text-left">
          <p className="text-xs sm:text-sm text-text-secondary">
            © {year} Famousli. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-text-secondary">
            AI-powered ads for businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
