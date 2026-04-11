import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Famousli Terms of Service — rules for using our AI ad creation platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
