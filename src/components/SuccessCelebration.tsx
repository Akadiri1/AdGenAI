"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCredits } from "./CreditsProvider";

export function SuccessCelebration() {
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(true);
  const { credits, refreshCredits } = useCredits();
  const [initialCredits, setInitialCredits] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setShow(true);
      setInitialCredits(credits);
      
      // Poll for credit update
      const interval = setInterval(async () => {
        const newCredits = await refreshCredits();
        if (typeof newCredits === 'number' && newCredits > (initialCredits ?? credits)) {
          setIsUpdating(false);
          clearInterval(interval);
        }
      }, 2000);

      const timer = setTimeout(() => setShow(false), 8000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [credits, refreshCredits]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
      {/* Confetti simulation */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: "50vw", y: "50vh", scale: 0, rotate: 0 }}
          animate={{ 
            x: `${Math.random() * 100}vw`, 
            y: `${Math.random() * 100}vh`,
            scale: Math.random() * 1.5 + 0.5,
            rotate: Math.random() * 360,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: Math.random() * 2 + 2, ease: "easeOut" }}
          className={`absolute h-3 w-3 rounded-sm ${
            ["bg-primary", "bg-secondary", "bg-accent", "bg-success", "bg-warning"][i % 5]
          }`}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: -20 }}
        className="pointer-events-auto flex flex-col items-center gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/5 max-w-sm w-full"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          {isUpdating ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            <CheckCircle2 className="h-10 w-10" />
          )}
        </div>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-text-primary">
            {isUpdating ? "Processing Payment..." : "Payment Successful!"}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isUpdating 
              ? "We're updating your credits. This will only take a moment." 
              : "Your credits have been added! You're ready to create magic."}
          </p>
        </div>
        {!isUpdating && (
          <button
            onClick={() => setShow(false)}
            className="mt-2 w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-all"
          >
            Start Creating Ads
          </button>
        )}
      </motion.div>
    </div>
  );
}
