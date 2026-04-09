"use client";

import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Eye, MousePointer, CheckCircle2, DollarSign, Trophy, Film, Lock } from "lucide-react";

type Ad = {
  id: string;
  headline: string | null;
  score: number | null;
  thumbnailUrl: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  platform: string[];
  createdAt: string;
};

type Totals = {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", NGN: "₦", INR: "₹", BRL: "R$", KES: "KSh", ZAR: "R",
};

export function AnalyticsClient({
  ads,
  totals,
  currency,
  showFullAnalytics = false,
}: {
  ads: Ad[];
  totals: Totals;
  currency: string;
  showFullAnalytics?: boolean;
}) {
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const roiMultiple = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  // Daily time series — group ads by day
  const byDay = new Map<string, { impressions: number; clicks: number; conversions: number }>();
  for (const ad of ads) {
    const day = new Date(ad.createdAt).toISOString().slice(0, 10);
    const prev = byDay.get(day) ?? { impressions: 0, clicks: 0, conversions: 0 };
    byDay.set(day, {
      impressions: prev.impressions + ad.impressions,
      clicks: prev.clicks + ad.clicks,
      conversions: prev.conversions + ad.conversions,
    });
  }
  const timeSeries = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...v,
    }));

  // Per-platform breakdown — sum stats across all ads posted to that platform
  type PlatformStats = {
    impressions: number; clicks: number; conversions: number;
    spend: number; revenue: number; ads: number;
  };
  const platformStats = new Map<string, PlatformStats>();
  for (const ad of ads) {
    for (const p of ad.platform) {
      const cur = platformStats.get(p) ?? { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0, ads: 0 };
      cur.impressions += ad.impressions;
      cur.clicks += ad.clicks;
      cur.conversions += ad.conversions;
      cur.spend += ad.spend;
      cur.revenue += ad.revenue;
      cur.ads += 1;
      platformStats.set(p, cur);
    }
  }
  const platformData = Array.from(platformStats.entries())
    .sort(([, a], [, b]) => (b.impressions + b.clicks) - (a.impressions + a.clicks))
    .map(([platform, s]) => ({
      platform: platform.replace("_", " "),
      platformKey: platform,
      engagement: s.impressions + s.clicks,
      ...s,
      ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
      roi: s.spend > 0 ? ((s.revenue - s.spend) / s.spend) * 100 : 0,
    }));

  const totalEngagement = platformData.reduce((sum, p) => sum + p.engagement, 0);

  const PLATFORM_ICONS: Record<string, string> = {
    INSTAGRAM: "📷", FACEBOOK: "📘", TIKTOK: "🎵", YOUTUBE: "▶️",
    X_TWITTER: "𝕏", LINKEDIN: "💼", WHATSAPP: "💬", PINTEREST: "📌", SNAPCHAT: "👻",
  };

  const bestAds = [...ads]
    .filter((ad) => ad.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 4);

  const kpis = [
    { label: "Impressions", value: totals.impressions.toLocaleString(), icon: Eye, color: "text-primary bg-primary/10" },
    { label: "Clicks", value: totals.clicks.toLocaleString(), icon: MousePointer, color: "text-accent bg-accent/10" },
    { label: "Conversions", value: totals.conversions.toLocaleString(), icon: CheckCircle2, color: "text-success bg-success/10" },
    { label: "Total Spend", value: `${sym}${totals.spend.toFixed(0)}`, icon: DollarSign, color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary">Last 30 days of activity across {ads.length} ad{ads.length !== 1 && "s"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-heading text-2xl font-bold text-text-primary">{kpi.value}</div>
              <div className="text-sm text-text-secondary">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-3xl border border-black/5 bg-gradient-to-br from-success/5 to-accent/5 p-8 shadow-sm ${!showFullAnalytics ? "relative" : ""}`}>
        {!showFullAnalytics && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 dark:bg-bg-dark/70 backdrop-blur-sm">
            <div className="text-center px-6">
              <Lock className="mx-auto h-8 w-8 text-warning mb-2" />
              <div className="font-heading font-bold text-text-primary mb-1">ROI Calculator — Pro feature</div>
              <p className="text-xs text-text-secondary mb-3">See exactly how much money your ads made vs what you spent</p>
              <Link href="/settings/billing" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-success" />
          <h2 className="font-heading text-xl font-bold text-text-primary">ROI Calculator</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Spent</div>
            <div className="font-heading text-2xl font-bold text-text-primary">
              {sym}{totals.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Revenue</div>
            <div className="font-heading text-2xl font-bold text-text-primary">
              {sym}{totals.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">ROI</div>
            <div className={`font-heading text-2xl font-bold ${roi >= 0 ? "text-success" : "text-danger"}`}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
            </div>
          </div>
        </div>
        {totals.spend > 0 && (
          <div className="mt-4 rounded-xl bg-white/70 p-4 text-sm text-text-primary">
            <strong>
              For every {sym}1 you spent, you made {sym}{roiMultiple.toFixed(2)}
            </strong>
          </div>
        )}
        {totals.spend === 0 && (
          <p className="mt-4 text-sm text-text-secondary">
            No ad spend tracked yet. Connect your ad accounts to see your ROI here.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-heading font-bold text-text-primary mb-4">Performance Over Time</h3>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5" }} />
                <Line type="monotone" dataKey="impressions" stroke="#FF6B35" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#2EC4B6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="#004E89" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-text-secondary text-sm">
              No data yet
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="font-heading font-bold text-text-primary mb-4">Engagement by Platform</h3>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5" }} />
                <Bar dataKey="engagement" fill="#FF6B35" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-text-secondary text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Per-platform detailed breakdown */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-text-primary">Per-Platform Performance</h3>
          <span className="text-xs text-text-secondary">{platformData.length} platform{platformData.length !== 1 && "s"}</span>
        </div>
        {platformData.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">
            No ads yet — create one to see platform breakdown
          </div>
        ) : (
          <div className="space-y-3">
            {platformData.map((p) => {
              const share = totalEngagement > 0 ? (p.engagement / totalEngagement) * 100 : 0;
              return (
                <div
                  key={p.platformKey}
                  className="rounded-2xl border border-black/5 bg-bg-secondary/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{PLATFORM_ICONS[p.platformKey] ?? "📱"}</span>
                      <div>
                        <div className="font-heading font-bold text-text-primary capitalize">
                          {p.platform.toLowerCase()}
                        </div>
                        <div className="text-xs text-text-secondary">{p.ads} ad{p.ads !== 1 && "s"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-primary">{share.toFixed(0)}%</div>
                      <div className="text-xs text-text-secondary">of engagement</div>
                    </div>
                  </div>

                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-warning"
                      style={{ width: `${share}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-xs">
                    <MiniStat label="Impressions" value={p.impressions.toLocaleString()} />
                    <MiniStat label="Clicks" value={p.clicks.toLocaleString()} />
                    <MiniStat label="CTR" value={`${p.ctr.toFixed(1)}%`} />
                    <MiniStat label="Spend" value={`${sym}${p.spend.toFixed(0)}`} />
                    <MiniStat
                      label="ROI"
                      value={p.spend > 0 ? `${p.roi >= 0 ? "+" : ""}${p.roi.toFixed(0)}%` : "—"}
                      color={p.spend > 0 ? (p.roi >= 0 ? "text-success" : "text-danger") : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            <h3 className="font-heading font-bold text-text-primary">Best Performing Ads</h3>
          </div>
          <Link href="/ads" className="text-sm font-semibold text-primary hover:underline">View all</Link>
        </div>
        {bestAds.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestAds.map((ad) => (
              <Link
                key={ad.id}
                href={`/ads/${ad.id}`}
                className="group overflow-hidden rounded-2xl border border-black/5 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-square bg-bg-secondary relative">
                  {ad.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.thumbnailUrl} alt={ad.headline ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Film className="h-8 w-8 text-text-secondary" /></div>
                  )}
                  <div className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-bold text-text-primary backdrop-blur">
                    {Math.round(ad.score ?? 0)}/100
                  </div>
                </div>
                <div className="p-3">
                  <div className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {ad.headline ?? "Untitled"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary py-8 text-center">No ads with scores yet</p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</div>
      <div className={`font-heading text-sm font-bold ${color ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}
