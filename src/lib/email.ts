export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP not configured, skipping email to", params.to);
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text && { text: params.text }),
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", (err as Error).message);
    return false;
  }
}

export function teamInviteEmail(params: {
  teamName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to join ${params.teamName} on Famousli`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 40px; height: 40px; background: linear-gradient(135deg, #FF6B35, #F39C12, #2EC4B6); border-radius: 10px; line-height: 40px; color: white; font-weight: bold; font-size: 18px;">A</div>
          <span style="font-size: 20px; font-weight: 800; margin-left: 8px; color: #1A1A2E;">Famousli</span>
        </div>
        <h1 style="font-size: 24px; color: #1A1A2E; margin-bottom: 10px;">You're invited!</h1>
        <p style="color: #6B7280; line-height: 1.6;">
          <strong style="color: #1A1A2E;">${params.inviterName}</strong> has invited you to join
          <strong style="color: #1A1A2E;">${params.teamName}</strong> as a <strong>${params.role}</strong> on Famousli.
        </p>
        <p style="color: #6B7280; line-height: 1.6;">
          Famousli is an AI-powered ad creation platform. Create professional ads in 30 seconds — no marketing degree needed.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.inviteUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accept Invite
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px; text-align: center;">
          If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  };
}
