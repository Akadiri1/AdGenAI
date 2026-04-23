"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type CaptionChunk, type CaptionStyle, CAPTION_STYLES } from "@/lib/captions";

interface KaraokeCaptionsProps {
  currentTime: number;
  chunks: CaptionChunk[];
  style: CaptionStyle;
}

export function KaraokeCaptions({ currentTime, chunks, style }: KaraokeCaptionsProps) {
  const activeChunk = chunks.find(
    (chunk) => currentTime >= chunk.start && currentTime <= chunk.end
  );

  const styleConfig = CAPTION_STYLES[style];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-6 text-center" style={{ top: '40%' }}>
      <AnimatePresence mode="wait">
        {activeChunk && (
          <motion.div
            key={activeChunk.start}
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`flex flex-wrap justify-center gap-x-2 gap-y-1 px-4 py-2 rounded-2xl ${styleConfig.bg ?? ""}`}
            style={{ boxShadow: styleConfig.shadow }}
          >
            {activeChunk.words.map((word, i) => {
              const isActive = currentTime >= word.start && currentTime <= word.end;
              return (
                <motion.span
                  key={i}
                  animate={{ 
                    scale: isActive ? 1.25 : 1,
                    color: isActive ? styleConfig.highlight.replace('text-', '') : styleConfig.color.replace('text-', ''),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`text-2xl sm:text-3xl lg:text-4xl ${styleConfig.font}`}
                  style={{ 
                    WebkitTextStroke: styleConfig.outline ?? "none",
                    // Framer motion color animates hex/rgb better than tailwind classes
                    color: isActive ? (style === 'viral' ? '#FFD700' : style === 'cyber' ? '#86efac' : '#FFFFFF') : '#FFFFFF'
                  }}
                >
                  {word.text}
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
