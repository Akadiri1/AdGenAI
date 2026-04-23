"use client";

import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from "@/components/icons/SocialIcons";
import type { ComponentType } from "react";

const PLATFORMS = [
  { key: "INSTAGRAM", label: "Instagram", icon: InstagramIcon, color: "from-pink-500 to-purple-500" },
  { key: "FACEBOOK", label: "Facebook", icon: FacebookIcon, color: "from-blue-600 to-blue-700" },
  { key: "TIKTOK", label: "TikTok", icon: TikTokIcon, color: "from-black to-pink-500" },
] as const;

export { PLATFORMS };

export type PlatformKey = typeof PLATFORMS[number]["key"];

type Props = {
  selected: PlatformKey[];
  onChange: (keys: PlatformKey[]) => void;
};

export function PlatformPicker({ selected, onChange }: Props) {
  const toggle = (key: PlatformKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {PLATFORMS.map((p) => {
        const active = selected.includes(p.key as any);
        const Icon = p.icon;

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => toggle(p.key as any)}
            className={`group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all ${
              active
                ? "border-primary bg-primary/5 shadow-md"
                : "border-black/10 bg-white hover:border-black/20"
            }`}
          >
            <Icon className="mb-1.5 h-7 w-7" />
            <span className="text-xs font-semibold text-text-primary">{p.label}</span>
            {active && (
              <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
