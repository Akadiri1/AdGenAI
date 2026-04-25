/**
 * Helpers for emailing every admin user when notable events happen.
 * Currently used by:
 *   - signup (auth.ts createUser event)
 *   - successful payment (Paystack + Stripe webhooks)
 */
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter((e): e is string => !!e);
}

export async function notifyAdminsOfPayment(input: {
  userEmail: string | null;
  userName?: string | null;
  type: string; // "subscription" | "credit_purchase" | etc
  plan?: string | null;
  amount: number;
  currency: string;
  provider: "stripe" | "paystack";
  providerId: string;
}) {
  try {
    const admins = await getAdminEmails();
    if (admins.length === 0) return;

    const isSubscription = input.type === "subscription" || !!input.plan;
    const subject = isSubscription
      ? `💸 New ${input.plan ?? ""} subscription: ${input.currency} ${input.amount.toFixed(2)} from ${input.userEmail ?? "unknown"}`
      : `💸 Payment received: ${input.currency} ${input.amount.toFixed(2)} from ${input.userEmail ?? "unknown"}`;

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1A1A2E; margin-bottom: 8px;">${isSubscription ? "New subscription" : "Payment received"}</h2>
        <p style="color: #6B7280; margin-top: 0;">A user just paid through Famousli.</p>
        <table style="width: 100%; margin: 16px 0; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6B7280;">User:</td><td style="padding: 6px 0; font-weight: 600;">${input.userEmail ?? "—"}${input.userName ? ` (${input.userName})` : ""}</td></tr>
          ${input.plan ? `<tr><td style="padding: 6px 0; color: #6B7280;">Plan:</td><td style="padding: 6px 0; font-weight: 600;">${input.plan}</td></tr>` : ""}
          <tr><td style="padding: 6px 0; color: #6B7280;">Type:</td><td style="padding: 6px 0; font-weight: 600;">${input.type}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">Amount:</td><td style="padding: 6px 0; font-weight: 600;">${input.currency} ${input.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">Provider:</td><td style="padding: 6px 0; font-weight: 600;">${input.provider}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">Reference:</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${input.providerId}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">Time:</td><td style="padding: 6px 0;">${new Date().toLocaleString()}</td></tr>
        </table>
        ${process.env.NEXTAUTH_URL ? `<a href="${process.env.NEXTAUTH_URL}/admin/revenue" style="display: inline-block; background: #FF6B35; color: white; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 600;">View in admin</a>` : ""}
      </div>
    `;

    await Promise.all(
      admins.map((to) => sendEmail({ to, subject, html })),
    );
  } catch (err) {
    console.error("[adminNotify] failed:", (err as Error).message);
  }
}
