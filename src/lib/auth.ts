import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/onboarding",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ? [
          EmailProvider({
            server: {
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT ?? 587),
              secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            },
            from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
          }),
        ]
      : process.env.EMAIL_SERVER
        ? [
            EmailProvider({
              server: process.env.EMAIL_SERVER,
              from: process.env.EMAIL_FROM ?? "noreply@famousli.com",
            }),
          ]
        : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Audit log
      await logAudit({
        userId: user.id,
        action: "user_signup",
        metadata: { email: user.email, name: user.name },
      });

      // Notify all admins by email
      try {
        const admins = await prisma.user.findMany({
          where: { isAdmin: true },
          select: { email: true },
        });
        const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[];
        if (adminEmails.length > 0) {
          await Promise.all(
            adminEmails.map((to) =>
              sendEmail({
                to,
                subject: `🎉 New Famousli signup: ${user.email ?? user.name ?? "Anonymous"}`,
                html: `
                  <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #1A1A2E; margin-bottom: 8px;">New user signed up</h2>
                    <p style="color: #6B7280;">Someone just created an account on Famousli.</p>
                    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #6B7280;">Email:</td><td style="padding: 8px 0; font-weight: 600;">${user.email ?? "—"}</td></tr>
                      <tr><td style="padding: 8px 0; color: #6B7280;">Name:</td><td style="padding: 8px 0; font-weight: 600;">${user.name ?? "—"}</td></tr>
                      <tr><td style="padding: 8px 0; color: #6B7280;">User ID:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${user.id}</td></tr>
                      <tr><td style="padding: 8px 0; color: #6B7280;">Time:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
                    </table>
                    <a href="${process.env.NEXTAUTH_URL ?? ""}/admin/users/${user.id}"
                       style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                      View in admin
                    </a>
                  </div>
                `,
              }),
            ),
          );
        }
      } catch (err) {
        console.error("[auth] Failed to notify admins of new signup:", (err as Error).message);
      }
    },
    async signIn({ user }) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        await logAudit({
          userId: user.id,
          action: "user_login",
        });
      } catch { /* ignore */ }
    },
  },
};
