/**
 * Famousli brand identity.
 * Features a circular "f" mark and a modern typographic logo.
 */

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-7 w-7", text: "text-base" },
  md: { box: "h-9 w-9", text: "text-xl" },
  lg: { box: "h-12 w-12", text: "text-2xl" },
  xl: { box: "h-16 w-16", text: "text-4xl" },
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
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Famousli"
    >
      {/* Background Circle — Using the primary brand color */}
      <circle cx="20" cy="20" r="20" fill="#FF6B35" />
      
      {/* Lowercase 'f' — Modern, Bold, and clean */}
      <path 
        d="M24.5 12.5C23.2 12.5 22.2 13.5 22.2 14.8V17.5H25.5V20.5H22.2V29H18.8V20.5H16.5V17.5H18.8V14.8C18.8 11.5 21 10 24.5 10V12.5Z" 
        fill="white" 
      />
    </svg>
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
