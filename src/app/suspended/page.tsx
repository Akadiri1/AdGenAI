import Link from "next/link";
import { Ban, Mail } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary/30 p-6">
      <div className="max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Account suspended</h1>
        <p className="text-text-secondary mb-6">
          Your Famousli account has been suspended. If you believe this is a mistake or want to appeal,
          please contact our support team and we&apos;ll get back to you as soon as possible.
        </p>
        <a
          href="mailto:support@famousli.com"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Mail className="h-4 w-4" /> Contact support
        </a>
        <div className="mt-4">
          <Link href="/api/auth/signout" className="text-xs text-text-secondary hover:text-text-primary underline">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
