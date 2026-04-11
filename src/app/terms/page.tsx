import Link from "next/link";
import { ArrowLeft, FileText, UserPlus, CreditCard, ShieldCheck, Lightbulb, Brain, Server, AlertTriangle, XCircle, Scale, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Famousli",
  description: "Terms and conditions for using the Famousli platform.",
};

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: [
      {
        subtitle: "Agreement",
        text: "By accessing or using Famousli (the \"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and Famousli.",
      },
      {
        subtitle: "Eligibility",
        text: "You must be at least 16 years of age to use the Service. By using the Service, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.",
      },
      {
        subtitle: "Modifications",
        text: "We reserve the right to modify these Terms at any time. We will notify you of material changes via email or a prominent notice on the platform at least 30 days in advance. Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms.",
      },
    ],
  },
  {
    icon: UserPlus,
    title: "2. Account Registration",
    content: [
      {
        subtitle: "Account Creation",
        text: "To use certain features of the Service, you must create an account. You may register using your email address or through third-party OAuth providers (Google, GitHub). You agree to provide accurate, current, and complete information during registration.",
      },
      {
        subtitle: "Account Security",
        text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account at support@famousli.com.",
      },
      {
        subtitle: "One Account Per Person",
        text: "Each individual may maintain only one free account. Creating multiple free accounts to circumvent usage limits is a violation of these Terms and may result in account termination.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "3. Subscription and Billing",
    content: [
      {
        subtitle: "Plans and Pricing",
        text: "Famousli offers Free, Starter, Pro, Business, and Enterprise plans. Pricing is listed on our website and may be updated from time to time. We will notify existing subscribers at least 30 days before any price changes take effect.",
      },
      {
        subtitle: "Credit System",
        text: "Paid plans include a monthly allocation of credits. Each ad creation consumes credits based on complexity (image ads: 1 credit, video ads: 2-3 credits). Unused credits roll over indefinitely while your subscription is active. Upon cancellation, rolled-over credits expire after 90 days.",
      },
      {
        subtitle: "Credit Packs",
        text: "You may purchase additional credit packs at any time. Credit packs do not expire and are non-refundable once purchased.",
      },
      {
        subtitle: "Billing",
        text: "Subscriptions are billed monthly or annually via Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis. You can switch between monthly and yearly billing at any time, with prorated adjustments.",
      },
      {
        subtitle: "Refunds",
        text: "Monthly subscriptions: You may request a full refund within 7 days of your first payment if you have used fewer than 10 credits. Annual subscriptions: You may request a prorated refund within 30 days of purchase. After these periods, refunds are issued at our discretion. Contact support@famousli.com for refund requests.",
      },
      {
        subtitle: "Cancellation",
        text: "You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. You retain access to paid features until the period ends.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "4. Acceptable Use Policy",
    content: [
      {
        subtitle: "Permitted Use",
        text: "You may use Famousli to create, schedule, and publish advertisements for legitimate business purposes. You retain responsibility for ensuring your ads comply with the advertising policies of each platform you post to.",
      },
      {
        subtitle: "Prohibited Content",
        text: "You may not use the Service to create ads that contain or promote: hate speech, discrimination, or harassment based on race, ethnicity, gender, religion, sexual orientation, or disability; violence, terrorism, or self-harm; illegal products or services; spam, phishing, or deceptive practices; misleading health or financial claims; sexually explicit content involving minors; content that infringes on third-party intellectual property rights.",
      },
      {
        subtitle: "Prohibited Activities",
        text: "You may not: reverse engineer, decompile, or attempt to extract source code from the Service; use automated bots or scrapers to access the Service; resell, sublicense, or redistribute the Service without authorization; attempt to circumvent usage limits, rate limits, or security measures; use the Service to build a competing product.",
      },
      {
        subtitle: "Enforcement",
        text: "We reserve the right to review content created on our platform and to suspend or terminate accounts that violate this Acceptable Use Policy. Repeated violations may result in permanent bans without refund.",
      },
    ],
  },
  {
    icon: Lightbulb,
    title: "5. Intellectual Property",
    content: [
      {
        subtitle: "Your Content",
        text: "You retain all ownership rights to content you upload to or create using the Service, including ad copy, images, videos, and brand assets. By using the Service, you grant Famousli a limited license to process, store, and display your content solely to provide the Service.",
      },
      {
        subtitle: "Platform License",
        text: "The Service, including its software, design, features, documentation, and branding, is owned by Famousli and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.",
      },
      {
        subtitle: "Templates and Assets",
        text: "Templates, stock images, music tracks, and other assets provided within the Service are licensed to you for use in ads created on our platform. You may not extract, redistribute, or resell these assets separately.",
      },
      {
        subtitle: "Feedback",
        text: "If you provide feedback, suggestions, or ideas about the Service, you grant Famousli an unrestricted, perpetual license to use such feedback for any purpose without compensation.",
      },
    ],
  },
  {
    icon: Brain,
    title: "6. AI-Generated Content Disclaimer",
    content: [
      {
        subtitle: "Nature of AI Content",
        text: "Famousli uses artificial intelligence to generate ad copy, images, and video content. While we strive for high quality, AI-generated content may occasionally be inaccurate, inappropriate, or not fully aligned with your intent. You are responsible for reviewing all generated content before publishing.",
      },
      {
        subtitle: "No Guarantee of Uniqueness",
        text: "Due to the nature of generative AI, content created for different users may have similarities. We do not guarantee that AI-generated content will be unique or free from resemblance to existing works.",
      },
      {
        subtitle: "Compliance Responsibility",
        text: "You are solely responsible for ensuring that ads created using the Service comply with all applicable laws, regulations, and platform-specific advertising policies. Famousli does not provide legal, financial, or medical advice through its generated content.",
      },
    ],
  },
  {
    icon: Server,
    title: "7. Platform Availability and SLA",
    content: [
      {
        subtitle: "Uptime Target",
        text: "We target 99.9% uptime for the Service, excluding scheduled maintenance windows. Scheduled maintenance will be announced at least 24 hours in advance via email and our status page.",
      },
      {
        subtitle: "No Guarantee",
        text: "While we make commercially reasonable efforts to maintain availability, we do not guarantee uninterrupted access to the Service. We are not liable for downtime caused by force majeure events, third-party service outages, or circumstances beyond our reasonable control.",
      },
      {
        subtitle: "Service Credits",
        text: "Enterprise plan customers may be eligible for service credits if monthly uptime falls below 99.9%, as outlined in their Enterprise agreement.",
      },
    ],
  },
  {
    icon: AlertTriangle,
    title: "8. Limitation of Liability",
    content: [
      {
        subtitle: "Disclaimer of Warranties",
        text: "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.",
      },
      {
        subtitle: "Limitation",
        text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADGENAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.",
      },
      {
        subtitle: "Third-Party Services",
        text: "We are not responsible for the actions, content, or policies of third-party platforms (Instagram, Facebook, TikTok, etc.) or payment processors (Stripe). Integration with third-party services is provided as a convenience and subject to their respective terms.",
      },
    ],
  },
  {
    icon: XCircle,
    title: "9. Termination",
    content: [
      {
        subtitle: "By You",
        text: "You may terminate your account at any time through your account settings or by contacting support@famousli.com. Upon termination, your data will be handled in accordance with our Privacy Policy.",
      },
      {
        subtitle: "By Us",
        text: "We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or pose a risk to other users or the Service. For non-critical violations, we will provide 14 days' notice before termination. For serious violations (fraud, abuse, illegal activity), we may terminate immediately.",
      },
      {
        subtitle: "Effect of Termination",
        text: "Upon termination, your right to use the Service ceases immediately. You may request a data export within 30 days of termination. After 30 days, your data will be deleted in accordance with our Privacy Policy.",
      },
    ],
  },
  {
    icon: Scale,
    title: "10. Governing Law",
    content: [
      {
        subtitle: "Jurisdiction",
        text: "These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.",
      },
      {
        subtitle: "Dispute Resolution",
        text: "Any disputes arising from these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association (AAA) in Delaware. Class action lawsuits and class-wide arbitration are waived.",
      },
      {
        subtitle: "Severability",
        text: "If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.",
      },
    ],
  },
  {
    icon: Mail,
    title: "11. Contact",
    content: [
      {
        subtitle: "Get in Touch",
        text: "For questions, concerns, or legal inquiries regarding these Terms of Service, please contact us at support@famousli.com. We aim to respond to all inquiries within 5 business days.",
      },
    ],
  },
];

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-4">
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-primary mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary text-lg">
            Last updated: April 7, 2026
          </p>
          <p className="mt-4 text-text-secondary leading-relaxed max-w-2xl">
            Please read these Terms of Service carefully before using Famousli. By accessing or
            using our platform, you agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <section.icon className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-5">
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <h3 className="font-heading font-semibold text-text-primary mb-1">
                      {item.subtitle}
                    </h3>
                    <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm text-center">
          <p className="text-text-secondary text-sm">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:support@famousli.com" className="text-primary font-semibold hover:underline">
              support@famousli.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
