import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "user_signup"
  | "user_login"
  | "user_logout"
  | "user_suspended"
  | "user_unsuspended"
  | "plan_upgraded"
  | "plan_downgraded"
  | "plan_canceled"
  | "ad_created"
  | "ad_edited"
  | "ad_deleted"
  | "ad_published"
  | "ad_scheduled"
  | "campaign_created"
  | "template_created"
  | "template_purchased"
  | "payment_received"
  | "payment_failed"
  | "credits_purchased"
  | "referral_signup"
  | "referral_conversion"
  | "referral_payout"
  | "team_created"
  | "team_member_invited"
  | "api_key_created"
  | "social_connected"
  | "brand_kit_updated"
  | "admin_action";

export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Don't crash the app if audit logging fails
    console.error("[audit] Failed to log:", (err as Error).message);
  }
}

export function getRequestContext(req: Request): { ipAddress: string; userAgent: string } {
  const fwd = req.headers.get("x-forwarded-for");
  const ipAddress = fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}
