"use client";

import {
  InstagramIcon, FacebookIcon, TikTokIcon, XTwitterIcon,
  LinkedInIcon, WhatsAppIcon, YouTubeIcon, PinterestIcon, SnapchatIcon,
} from "@/components/icons/SocialIcons";
import { ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Account = {
  id: string;
  platform: string;
  accountId: string;
  accountName: string | null;
  isActive: boolean;
  tokenExpiry: string | null;
};

type ProviderConfig = {
  platform: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  href: string;
  available: boolean;
  bgClass: string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    platform: "INSTAGRAM",
    name: "Instagram",
    icon: InstagramIcon,
    description: "Post images, reels, and stories to your Business account",
    href: "/api/connect/meta",
    available: false,
    bgClass: "from-purple-500 via-pink-500 to-orange-400",
  },
  {
    platform: "FACEBOOK",
    name: "Facebook",
    icon: FacebookIcon,
    description: "Publish to your Facebook Pages with photos and videos",
    href: "/api/connect/facebook",
    available: false,
    bgClass: "from-blue-600 to-blue-700",
  },
  {
    platform: "TIKTOK",
    name: "TikTok",
    icon: TikTokIcon,
    description: "Upload short-form video ads directly to TikTok",
    href: "/api/connect/tiktok",
    available: false,
    bgClass: "from-gray-900 via-gray-800 to-pink-500",
  },
];

export function ConnectClient({
  accounts,
  success,
  error,
  userPlan,
}: {
  accounts: Account[];
  success: string | null;
  error: string | null;
  userPlan: string;
}) {
  const connectedPlatforms = new Set(accounts.filter((a) => a.isActive).map((a) => a.platform));
  const isPro = ["PRO", "BUSINESS", "ENTERPRISE"].includes(userPlan);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text-primary">Connect Your Accounts</h1>
        <p className="text-text-secondary mt-1">
          Link once — we handle the posting automatically
        </p>
      </div>

      <div className="mb-6 rounded-2xl border-2 border-warning/30 bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-bold text-text-primary mb-1">Auto-posting is coming soon</h3>
            <p className="text-sm text-text-secondary">
              We&apos;re finalizing direct integrations with Instagram, Facebook, TikTok, and WhatsApp Business. For now,
              create your ads, download them with no watermark, and post manually. We&apos;ll email you the second auto-posting goes live.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 rounded-2xl border border-success/20 bg-success/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          <span className="text-sm font-semibold text-success">
            {success.charAt(0).toUpperCase() + success.slice(1)} connected successfully
          </span>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger font-semibold">
          Connection failed: {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => {
          const Icon = p.icon;
          const connected = connectedPlatforms.has(p.platform);
          const connectedAccounts = accounts.filter(
            (a) => a.platform === p.platform && a.isActive,
          );

          return (
            <div
              key={p.platform}
              className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:shadow-md ${
                !p.available ? "opacity-75" : ""
              }`}
            >
              {/* Gradient header strip */}
              <div className={`h-2 bg-gradient-to-r ${p.bgClass}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0">
                      <Icon className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-text-primary">{p.name}</h3>
                      {connected ? (
                        <div className="flex items-center gap-1 text-xs text-success font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </div>
                      ) : !isPro && (
                        <div className="flex items-center gap-1 text-[10px] text-warning font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          Pro Only
                        </div>
                      )}
                    </div>
                  </div>

                  {!p.available ? (
                    <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
                      <Clock className="h-3 w-3" />
                      Soon
                    </span>
                  ) : !isPro && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-text-secondary">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-text-secondary mb-4 leading-relaxed">{p.description}</p>

                {connectedAccounts.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {connectedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between rounded-xl bg-bg-secondary px-3 py-2"
                      >
                        <span className="text-xs font-semibold text-text-primary truncate">
                          @{acc.accountName ?? acc.accountId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {acc.tokenExpiry && new Date(acc.tokenExpiry) < new Date(Date.now() + 7 * 86400000) && (
                            <span className="text-[10px] text-warning font-semibold">Expires soon</span>
                          )}
                          <span className="h-2 w-2 rounded-full bg-success" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!p.available ? (
                  <button
                    disabled
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-black/5 bg-bg-secondary text-sm font-semibold text-text-secondary cursor-not-allowed"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Coming soon
                  </button>
                ) : isPro ? (
                  <a
                    href={p.href}
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                      connected
                        ? "border-2 border-black/10 bg-white text-text-primary hover:bg-bg-secondary"
                        : "bg-primary text-white hover:bg-primary-dark shadow-sm"
                    }`}
                  >
                    {connected ? "Reconnect" : `Connect ${p.name}`}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    href="/settings/billing"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-sm font-bold text-primary hover:bg-primary/10 transition-all"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-2">How auto-posting works</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-text-secondary">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-xs">1</div>
            <p>Connect your accounts above. We store tokens securely — never your password.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-xs">2</div>
            <p>Create an ad in Magic or Advanced mode. Choose which platforms to target.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-xs">3</div>
            <p>Click Post now or Schedule — we upload, caption, and publish for you automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
