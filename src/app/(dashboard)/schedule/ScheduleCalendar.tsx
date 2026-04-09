"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays } from "lucide-react";

type ScheduledAd = {
  id: string;
  headline: string | null;
  status: string;
  scheduledAt: string;
  platform: string[];
  thumbnailUrl: string | null;
};

export function ScheduleCalendar({
  ads,
  startDate,
}: {
  ads: ScheduledAd[];
  startDate: string;
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(startDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthName = viewMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDay = new Date(viewMonth);
  const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const adsByDay = new Map<number, ScheduledAd[]>();
  for (const ad of ads) {
    const d = new Date(ad.scheduledAt);
    if (d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear()) {
      const day = d.getDate();
      if (!adsByDay.has(day)) adsByDay.set(day, []);
      adsByDay.get(day)!.push(ad);
    }
  }

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === viewMonth.getMonth() && today.getFullYear() === viewMonth.getFullYear();

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-text-primary">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 hover:bg-bg-secondary"
          >
            ←
          </button>
          <button
            onClick={() => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-lg border border-black/10 px-3 text-sm font-semibold hover:bg-bg-secondary"
          >
            Today
          </button>
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider text-text-secondary py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-bg-secondary/30" />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dayAds = adsByDay.get(day) ?? [];
          const isToday = isCurrentMonth && today.getDate() === day;
          return (
            <div
              key={day}
              className={`aspect-square rounded-xl border p-2 transition-colors ${
                isToday
                  ? "border-primary bg-primary/5"
                  : "border-black/5 bg-white hover:bg-bg-secondary/30"
              }`}
            >
              <div className={`text-xs font-bold ${isToday ? "text-primary" : "text-text-primary"}`}>
                {day}
              </div>
              <div className="mt-1 space-y-0.5">
                {dayAds.slice(0, 2).map((ad) => (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.id}`}
                    className="block truncate rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/30"
                  >
                    {new Date(ad.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {ad.headline?.slice(0, 20) ?? "Ad"}
                  </Link>
                ))}
                {dayAds.length > 2 && (
                  <div className="px-1.5 text-[10px] font-semibold text-text-secondary">+{dayAds.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {ads.length === 0 && (
        <div className="mt-8 text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
            <CalendarDays className="h-8 w-8 text-text-secondary" />
          </div>
          <p className="font-heading font-semibold text-text-primary mb-1">Nothing scheduled yet</p>
          <p className="text-sm text-text-secondary">Schedule your first ad from the ad detail page</p>
        </div>
      )}
    </div>
  );
}
