import { prisma } from "@/lib/prisma";

/**
 * Server component: renders signups + revenue last-30-days as inline SVG bar charts.
 * No client JS, no chart library.
 */
export async function AdminCharts() {
  const days = 30;
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400 * 1000);
  start.setHours(0, 0, 0, 0);

  const [signups, transactions] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { status: "completed", createdAt: { gte: start } },
      select: { createdAt: true, amount: true },
    }),
  ]);

  const signupBuckets = new Array(days).fill(0);
  const revenueBuckets = new Array(days).fill(0);

  for (const u of signups) {
    const idx = Math.floor((u.createdAt.getTime() - start.getTime()) / 86400000);
    if (idx >= 0 && idx < days) signupBuckets[idx]++;
  }
  for (const t of transactions) {
    const idx = Math.floor((t.createdAt.getTime() - start.getTime()) / 86400000);
    if (idx >= 0 && idx < days) revenueBuckets[idx] += t.amount;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Signups (last 30 days)" data={signupBuckets} color="#FF6B35" formatValue={(v) => v.toString()} />
      <ChartCard title="Revenue (last 30 days)" data={revenueBuckets} color="#2EC4B6" formatValue={(v) => `$${v.toFixed(0)}`} />
    </div>
  );
}

function ChartCard({
  title, data, color, formatValue,
}: { title: string; data: number[]; color: string; formatValue: (v: number) => string }) {
  const max = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);
  const w = 600;
  const h = 160;
  const barW = w / data.length;
  const padding = 2;

  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
      <div className="flex items-baseline justify-between mb-4 relative z-10">
        <h2 className="font-heading text-lg font-bold text-text-primary">{title}</h2>
        <div className="text-sm font-bold text-text-primary">{formatValue(total)}</div>
      </div>
      <div className="relative z-10 w-full overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full h-auto drop-shadow-sm">
          {data.map((v, i) => {
          const barH = (v / max) * h;
          return (
            <g key={i}>
              <rect
                x={i * barW + padding}
                y={h - barH}
                width={barW - padding * 2}
                height={barH}
                fill={color}
                rx={2}
              >
                <title>{`Day ${i + 1}: ${formatValue(v)}`}</title>
              </rect>
            </g>
          );
        })}
        <line x1={0} y1={h} x2={w} y2={h} stroke="#e5e7eb" strokeWidth={1} />
        <text x={0} y={h + 18} fontSize={11} fill="#6B7280">30d ago</text>
        <text x={w} y={h + 18} fontSize={11} fill="#6B7280" textAnchor="end">today</text>
        </svg>
      </div>
    </div>
  );
}
