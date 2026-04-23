/**
 * Famousli brand identity.
 * Features a circular "f" mark and a modern typographic logo.
 */

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-7 w-auto", text: "text-base" },
  md: { box: "h-9 w-auto", text: "text-xl" },
  lg: { box: "h-12 w-auto", text: "text-2xl" },
  xl: { box: "h-16 w-auto", text: "text-4xl" },
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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={s.box} />
      {withText && (
        <span className={`font-heading font-black tracking-tight flex items-center ${s.text} text-text-primary`}>
          Famous<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">li</span>
        </span>
      )}
    </div>
  );
}

/**
 * Circular "f" logo mark.
 * Clean, bold "f" centered in a vibrant primary-colored circle.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.jpg"
      alt="Famousli Logo"
      className={`rounded-full ${className}`}
    />
  );
}

/**
 * Watermark variant — applied to free-tier ad exports.
 */
export function Watermark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/10 ${className}`}
    >
      <LogoMark className="h-4 w-4" />
      <span className="text-[11px] font-black uppercase tracking-widest text-white">
        FAMOUS<span className="text-primary">LI</span>
      </span>
    </div>
  );
}
