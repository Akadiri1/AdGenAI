/**
 * Famousli logo — a stylized spark/peak mark inside a gradient rounded square.
 * Represents: creative energy (spark), momentum (peak), and AI generation
 * (gradient fill matching brand palette).
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

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Famousli"
    >
      <defs>
        <linearGradient id="famousli-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B35" />
          <stop offset="0.5" stopColor="#F39C12" />
          <stop offset="1" stopColor="#2EC4B6" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="url(#famousli-grad)" />
      {/*
        Stylized lowercase "f" — Cluely-style geometric letterform.
        The "f" is the first letter of "famousli", carved with:
        - A vertical stem (the backbone)
        - A curved top hook (the ascending stroke, simplified to a quarter-arc)
        - A horizontal crossbar (the defining feature of "f")
        - A small dot above-right (the "li" spark — represents the AI/generation signal)
      */}
      {/* Vertical stem */}
      <path
        d="M16 14V30"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Top hook — a quarter-arc curving right from the top of the stem */}
      <path
        d="M16 14C16 10.5 18.5 8 22 8H24"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Crossbar */}
      <path
        d="M11 20H23"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* "li" spark dot — represents the AI signal, aligns with the gradient "li" in the wordmark */}
      <circle cx="29" cy="10" r="2.8" fill="white" />
    </svg>
  );
}

/**
 * Watermark variant — applied to free-tier ad exports.
 * Semi-transparent, pill-shaped, safe for bottom-right overlay.
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
        <defs>
          <linearGradient id="wm-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6B35" />
            <stop offset="1" stopColor="#2EC4B6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#wm-grad)" />
        <path d="M16 14V30" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M16 14C16 10.5 18.5 8 22 8H24" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M11 20H23" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="29" cy="10" r="2.8" fill="white" />
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
        Made with Famousli
      </span>
    </div>
  );
}
