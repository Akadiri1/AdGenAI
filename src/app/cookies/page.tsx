import Link from "next/link";
import { ArrowLeft, Cookie, Settings, BarChart3, Target, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Famousli",
  description: "Learn about the cookies Famousli uses and how to manage your preferences.",
};

const cookieCategories = [
  {
    icon: Shield,
    name: "Essential Cookies",
    description: "Required for the platform to function. Cannot be disabled.",
    color: "text-success",
    bgColor: "bg-success/10",
    cookies: [
      { name: "next-auth.session-token", purpose: "User authentication and session management", duration: "30 days", provider: "Famousli" },
      { name: "next-auth.csrf-token", purpose: "Cross-site request forgery protection", duration: "Session", provider: "Famousli" },
      { name: "next-auth.callback-url", purpose: "OAuth callback routing", duration: "Session", provider: "Famousli" },
      { name: "cookie_consent", purpose: "Stores your cookie consent preferences", duration: "1 year", provider: "Famousli" },
      { name: "lang", purpose: "Stores your preferred language", duration: "1 year", provider: "Famousli" },
      { name: "theme", purpose: "Stores your dark/light mode preference", duration: "1 year", provider: "Famousli" },
    ],
  },
  {
    icon: BarChart3,
    name: "Analytics Cookies",
    description: "Help us understand how visitors interact with our platform so we can improve it.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    cookies: [
      { name: "_ga", purpose: "Distinguishes unique users for Google Analytics", duration: "2 years", provider: "Google" },
      { name: "_ga_*", purpose: "Maintains session state in Google Analytics 4", duration: "2 years", provider: "Google" },
      { name: "_gid", purpose: "Distinguishes users for Google Analytics", duration: "24 hours", provider: "Google" },
      { name: "_gat", purpose: "Throttles Google Analytics request rate", duration: "1 minute", provider: "Google" },
    ],
  },
  {
    icon: Settings,
    name: "Preference Cookies",
    description: "Remember your settings and choices to personalize your experience.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    cookies: [
      { name: "preferred_currency", purpose: "Stores your selected currency for pricing", duration: "1 year", provider: "Famousli" },
      { name: "billing_cycle", purpose: "Remembers monthly/yearly billing toggle", duration: "1 year", provider: "Famousli" },
      { name: "onboarding_complete", purpose: "Tracks whether onboarding wizard was completed", duration: "Persistent", provider: "Famousli" },
    ],
  },
  {
    icon: Target,
    name: "Marketing Cookies",
    description: "Used to measure the effectiveness of our advertising campaigns.",
    color: "text-warning",
    bgColor: "bg-warning/10",
    cookies: [
      { name: "_fbp", purpose: "Meta Pixel — tracks visits for Facebook ad targeting", duration: "3 months", provider: "Meta" },
      { name: "_fbc", purpose: "Meta Pixel — stores click identifier from Facebook ads", duration: "3 months", provider: "Meta" },
      { name: "__stripe_mid", purpose: "Stripe fraud prevention and payment analytics", duration: "1 year", provider: "Stripe" },
      { name: "__stripe_sid", purpose: "Stripe session tracking for payment processing", duration: "30 minutes", provider: "Stripe" },
    ],
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-bg-secondary/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-warning mb-4">
            <Cookie className="h-3.5 w-3.5" />
            Cookie Policy
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-primary mb-4">
            Cookie Policy
          </h1>
          <p className="text-text-secondary text-lg">
            Last updated: April 7, 2026
          </p>
          <p className="mt-4 text-text-secondary leading-relaxed max-w-2xl">
            This Cookie Policy explains what cookies are, how Famousli uses them,
            and how you can manage your cookie preferences.
          </p>
        </div>

        {/* What are cookies */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm mb-8">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mb-4">
            What Are Cookies?
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
            Cookies are small text files placed on your device when you visit a website.
            They are widely used to make websites work efficiently, remember your preferences,
            and provide analytics information. Some cookies are essential for the website to
            function, while others help us improve your experience or deliver relevant advertising.
          </p>
        </div>

        {/* Cookie categories with tables */}
        <div className="space-y-8">
          {cookieCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.bgColor}`}>
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary">
                  {category.name}
                </h2>
              </div>
              <p className="text-text-secondary text-sm mb-6 ml-13 sm:ml-[52px]">
                {category.description}
              </p>

              {/* Cookie table */}
              <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="py-3 pr-4 text-left font-heading font-semibold text-text-primary">Cookie</th>
                      <th className="py-3 pr-4 text-left font-heading font-semibold text-text-primary hidden sm:table-cell">Purpose</th>
                      <th className="py-3 pr-4 text-left font-heading font-semibold text-text-primary">Duration</th>
                      <th className="py-3 text-left font-heading font-semibold text-text-primary hidden md:table-cell">Provider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {category.cookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td className="py-3 pr-4">
                          <code className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs font-mono text-text-primary">
                            {cookie.name}
                          </code>
                          <p className="text-xs text-text-secondary mt-1 sm:hidden">{cookie.purpose}</p>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary hidden sm:table-cell">{cookie.purpose}</td>
                        <td className="py-3 pr-4 text-text-secondary">{cookie.duration}</td>
                        <td className="py-3 text-text-secondary hidden md:table-cell">{cookie.provider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* How to manage cookies */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm mt-8">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mb-4">
            How to Manage Cookies
          </h2>
          <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
            <p>
              You can manage your cookie preferences at any time using our cookie consent banner,
              which appears when you first visit our site. You can also clear your preferences by
              deleting the <code className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs font-mono text-text-primary">cookie_consent</code> item
              from your browser&apos;s local storage.
            </p>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically
              find these options under &quot;Privacy&quot; or &quot;Security&quot; in your browser preferences:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
              <li><strong>Edge:</strong> Settings &gt; Cookies and site permissions</li>
            </ul>
            <p>
              Please note that disabling essential cookies may prevent certain features of our
              platform from working correctly, including authentication and session management.
            </p>
          </div>
        </div>

        {/* Third-party cookies */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm mt-8">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Third-Party Cookies
          </h2>
          <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
            <p>
              Some cookies on our platform are set by third-party services we integrate with:
            </p>
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4">
                <h3 className="font-heading font-semibold text-text-primary mb-1">Stripe</h3>
                <p className="text-xs text-text-secondary">
                  Processes payments and sets cookies for fraud prevention and secure transactions.
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4">
                <h3 className="font-heading font-semibold text-text-primary mb-1">Google Analytics</h3>
                <p className="text-xs text-text-secondary">
                  Collects anonymized usage statistics to help us understand how visitors use our platform.
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4">
                <h3 className="font-heading font-semibold text-text-primary mb-1">Meta Pixel</h3>
                <p className="text-xs text-text-secondary">
                  Measures the effectiveness of our Facebook and Instagram advertising campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm text-center">
          <p className="text-text-secondary text-sm">
            Questions about our cookie practices? Contact us at{" "}
            <a href="mailto:support@famousli.com" className="text-primary font-semibold hover:underline">
              support@famousli.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
