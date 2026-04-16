/**
 * Famousli logo — Cluely-inspired abstract geometric mark.
 * Four rounded shapes in a 2×2 cluster, each in a distinct brand colour.
 * Represents: creativity (variety of shapes), energy (warm palette),
 * and AI intelligence (cool teal accent).
 */

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-7 w-7", text: "text-base" },
  md: { box: "h-9 w-9", text: "text-xl" },
  lg: { box: "h-12 w-12", text: "text-2xl" },
  xl: { box: "h-16 w-16", text: "text-3xl" },
};

export function Logo({
  size = "md",
  withText = true,
  className = "",
}: {
  size?: Size;
  withText?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={s.box} />
      {withText && (
        <span className={`font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-white ${s.text}`}>
          Famous<span className="gradient-text">li</span>
        </span>
      )}
    </div>
  );
}

/**
 * Abstract geometric logo mark — four rounded shapes in a 2×2 grid.
 * Each quadrant uses a different brand colour with unique corner radii
 * to create visual interest, similar to Cluely's icon style.
 *
 *  ┌─────┐ ┌─────┐
 *  │coral│ │gold │
 *  └─────┘ └─────┘
 *  ┌─────┐ ┌─────┐
 *  │purpl│ │teal │
 *  └─────┘ └─────┘
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Famousli"
    >
      {/* Top-left — coral/orange, fully rounded top-left corner */}
      <rect x="1" y="1" width="17.5" height="17.5" rx="6" ry="6" fill="#FF6B35" />
      {/* Top-right — warm gold, pill-shaped (tall rounded right) */}
      <rect x="21.5" y="1" width="17.5" height="17.5" rx="8.75" ry="6" fill="#F39C12" />
      {/* Bottom-left — soft purple, rounded bottom-left */}
      <rect x="1" y="21.5" width="17.5" height="17.5" rx="6" ry="8.75" fill="#A855F7" />
      {/* Bottom-right — teal/mint, circular feel */}
      <rect x="21.5" y="21.5" width="17.5" height="17.5" rx="8.75" ry="8.75" fill="#2EC4B6" />
    </svg>
  );
}

/**
 * Watermark variant — applied to free-tier ad exports.
 * Semi-transparent, pill-shaped, safe for bottom-right overlay.
 * Uses the same 4-shape geometric mark at a smaller size.
 */
export function Watermark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        className="h-3.5 w-3.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="17.5" height="17.5" rx="6" ry="6" fill="#FF6B35" />
        <rect x="21.5" y="1" width="17.5" height="17.5" rx="8.75" ry="6" fill="#F39C12" />
        <rect x="1" y="21.5" width="17.5" height="17.5" rx="6" ry="8.75" fill="#A855F7" />
        <rect x="21.5" y="21.5" width="17.5" height="17.5" rx="8.75" ry="8.75" fill="#2EC4B6" />
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
        Made with Famousli
      </span>
    </div>
  );
}
