"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import {
  Building2, Globe, FileText, Users, Palette, Image, MessageSquareQuote,
  Sparkles, Save,
} from "lucide-react";
import { AIRewriteOnly } from "@/components/ui/AIRewriteOnly";
import { FileUpload } from "@/components/ui/FileUpload";

type Form = {
  businessName: string;
  businessType: string;
  businessUrl: string;
  businessDescription: string;
  businessIndustry: string;
  targetAudience: string;
  brandTagline: string;
  brandVoice: string;
  brandLogo: string;
  brandColors: { primary: string; secondary: string; accent: string };
  language: string;
  country: string;
  currency: string;
};

const INDUSTRIES = [
  "Restaurant / Food", "Fashion / Apparel", "Tech / SaaS", "Real Estate",
  "Fitness / Health", "Beauty / Skincare", "Education", "E-commerce",
  "Travel / Hospitality", "Finance", "Healthcare", "Entertainment",
  "Automotive", "Home Services", "Non-Profit", "Other",
];

const VOICES = [
  { key: "professional", label: "Professional", description: "Clean, authoritative, trustworthy" },
  { key: "playful", label: "Playful", description: "Fun, witty, casual" },
  { key: "bold", label: "Bold", description: "Confident, direct, impactful" },
  { key: "friendly", label: "Friendly", description: "Warm, approachable, conversational" },
  { key: "luxurious", label: "Luxurious", description: "Premium, elegant, exclusive" },
  { key: "inspirational", label: "Inspirational", description: "Motivating, empowering, uplifting" },
];

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" },
  { code: "de", name: "German" }, { code: "pt", name: "Portuguese" }, { code: "it", name: "Italian" },
  { code: "hi", name: "Hindi" }, { code: "ar", name: "Arabic" }, { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" }, { code: "sw", name: "Swahili" }, { code: "yo", name: "Yoruba" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "INR", "BRL", "KES", "GHS", "ZAR", "JPY", "CNY"];

export function BrandKitClient({ initial }: { initial: Form }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  // Calculate completion percentage
  const filledFields = [
    form.businessName, form.businessType, form.businessDescription,
    form.businessIndustry, form.targetAudience, form.brandTagline,
    form.brandVoice, form.brandLogo,
  ].filter(Boolean).length;
  const completion = Math.round((filledFields / 8) * 100);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      success("Brand kit saved — AI will use this for your next ad");
      router.refresh();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Brand Kit</h1>
        <p className="text-text-secondary mt-1">
          Tell us about your business — AI uses this to make every ad match your brand
        </p>
      </div>

      {/* Completion meter */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">Profile completion</span>
          <span className={`text-sm font-bold ${completion === 100 ? "text-success" : "text-primary"}`}>
            {completion}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completion === 100 ? "bg-success" : "bg-primary"}`}
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="mt-2 text-xs text-text-secondary">
            Complete your profile for better AI-generated ads that match your brand
          </p>
        )}
      </div>

      {/* Business Information */}
      <Section icon={Building2} title="Business Information" description="The basics about your business">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} placeholder="Acme Studio" required />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Industry <Required />
            </label>
            <select
              value={form.businessIndustry}
              onChange={(e) => setForm({ ...form, businessIndustry: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <Field label="Business type" value={form.businessType} onChange={(v) => setForm({ ...form, businessType: v })} placeholder="E-commerce, SaaS, Local service, etc." />
        <Field label="Website" value={form.businessUrl} onChange={(v) => setForm({ ...form, businessUrl: v })} placeholder="https://acme.com" type="url" />
      </Section>

      {/* What You Do */}
      <Section icon={FileText} title="What You Do" description="Help AI understand your business deeply">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Business description <Required />
            </span>
            <AIRewriteOnly value={form.businessDescription} onChange={(v) => setForm({ ...form, businessDescription: v })} fieldType="generic" maxLength={500} />
          </div>
          <textarea
            value={form.businessDescription}
            onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
            rows={4}
            maxLength={500}
            placeholder="We make handcrafted soy candles with natural fragrances. We ship worldwide and focus on eco-friendly packaging. Our customers are women aged 25-45 who value wellness and home aesthetics..."
            className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-1 text-right text-xs text-text-secondary">{form.businessDescription.length}/500</div>
        </div>
        <Field
          label="Tagline / Slogan"
          value={form.brandTagline}
          onChange={(v) => setForm({ ...form, brandTagline: v })}
          placeholder="Light up your world naturally"
        />
      </Section>

      {/* Target Audience */}
      <Section icon={Users} title="Target Audience" description="Who should your ads reach?">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Describe your ideal customer <Required />
            </span>
            <AIRewriteOnly value={form.targetAudience} onChange={(v) => setForm({ ...form, targetAudience: v })} fieldType="generic" maxLength={300} />
          </div>
          <textarea
            value={form.targetAudience}
            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            rows={3}
            maxLength={300}
            placeholder="Women aged 25-45, urban, interested in wellness, home decor, sustainability. Shops online, active on Instagram and Pinterest..."
            className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-1 text-right text-xs text-text-secondary">{form.targetAudience.length}/300</div>
        </div>
      </Section>

      {/* Brand Voice */}
      <Section icon={MessageSquareQuote} title="Brand Voice" description="How should your ads sound?">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VOICES.map((v) => (
            <label
              key={v.key}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                form.brandVoice === v.key ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
              }`}
            >
              <input
                type="radio"
                name="voice"
                checked={form.brandVoice === v.key}
                onChange={() => setForm({ ...form, brandVoice: v.key })}
                className="mt-1"
              />
              <div>
                <div className="font-heading text-sm font-semibold text-text-primary">{v.label}</div>
                <div className="text-xs text-text-secondary">{v.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Visual Identity */}
      <Section icon={Palette} title="Visual Identity" description="Your colors and logo">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["primary", "secondary", "accent"] as const).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary capitalize">{key} color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.brandColors[key]}
                  onChange={(e) => setForm({ ...form, brandColors: { ...form.brandColors, [key]: e.target.value } })}
                  className="h-11 w-14 cursor-pointer rounded-lg border-2 border-black/10 bg-white"
                />
                <input
                  type="text"
                  value={form.brandColors[key]}
                  onChange={(e) => setForm({ ...form, brandColors: { ...form.brandColors, [key]: e.target.value } })}
                  className="flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Color preview */}
        <div className="mt-4 rounded-xl overflow-hidden flex h-12">
          <div className="flex-1" style={{ backgroundColor: form.brandColors.primary }} />
          <div className="flex-1" style={{ backgroundColor: form.brandColors.secondary }} />
          <div className="flex-1" style={{ backgroundColor: form.brandColors.accent }} />
        </div>

        {/* Logo */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Logo
          </label>
          <FileUpload
            value={form.brandLogo}
            onChange={(url) => setForm({ ...form, brandLogo: url })}
            folder="brands/logos"
            label="Upload logo"
            previewSize="lg"
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            Upload or drag & drop your logo. It will appear on your ads (paid plans).
          </p>
        </div>
      </Section>

      {/* Localization */}
      <Section icon={Globe} title="Localization" description="Language and currency for your ads">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <Field label="Country (ISO)" value={form.country} onChange={(v) => setForm({ ...form, country: v.toUpperCase() })} placeholder="US" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* How AI uses this */}
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-heading font-bold text-text-primary mb-1">How AI uses your brand kit</div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every time you generate an ad, AI reads your business description, target audience, brand voice, and colors.
              It matches your tone, references your products, and suggests visuals that fit your brand.
              The more you fill in, the better your ads get — automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-all"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save brand kit"}
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">{title}</h2>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {label} {required && <Required />}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

function Required() {
  return <span className="text-danger text-[10px] font-normal">required</span>;
}
