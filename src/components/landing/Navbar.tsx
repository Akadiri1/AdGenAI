"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo size="sm" className="flex md:hidden" />
          <Logo size="md" className="hidden md:flex" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            How it works
          </a>
          <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            FAQ
          </a>
          <Link href="/tools/hook-generator" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            Free Hook Generator
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-text-primary hover:text-primary transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Start free
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium">Features</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-sm font-medium">Pricing</a>
            <a href="#faq" onClick={() => setOpen(false)} className="text-sm font-medium">FAQ</a>
            <hr className="border-black/10" />
            <Link href="/auth/login" className="text-sm font-semibold">Log in</Link>
            <Link href="/auth/signup" className="rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white">
              Start free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
