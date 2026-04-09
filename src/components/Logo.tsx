/**
 * AdGenAI logo — a stylized "A" formed by a spark/arrow shape
 * Represents: creative energy (spark), momentum (arrow-right),
 * and AI generation (gradient fill matching brand palette).
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
        <span className={`font-heading font-extrabold tracking-tight text-text-primary ${s.text}`}>
          AdGen<span className="gradient-text">AI</span>
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
      aria-label="AdGenAI"
    >
      <defs>
        <linearGradient id="adgenai-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B35" />
          <stop offset="0.5" stopColor="#F39C12" />
          <stop offset="1" stopColor="#2EC4B6" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="url(#adgenai-grad)" />
      {/* Stylized "A" with a spark dot — represents AI-generated creativity */}
      <path
        d="M12 28L20 12L28 28"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 22H24.5"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Spark dot — the "AI" / generation signal */}
      <circle cx="30" cy="11" r="2.5" fill="white" />
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
        <path d="M12 28L20 12L28 28M15.5 22H24.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30" cy="11" r="2.5" fill="white" />
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
        Made with AdGenAI
      </span>
    </div>
  );
}
