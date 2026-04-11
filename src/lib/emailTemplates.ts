/**
 * Branded HTML email templates for Famousli.
 * All templates use inline CSS (required for email clients).
 * Brand colors: #FF6B35 primary, #2EC4B6 secondary, #F39C12 accent.
 */

const BRAND = {
  primary: "#FF6B35",
  secondary: "#2EC4B6",
  accent: "#F39C12",
  dark: "#1A1A2E",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  bg: "#FAFAFA",
  white: "#FFFFFF",
  border: "rgba(0,0,0,0.06)",
};

/**
 * Wraps any inner HTML in the standard Famousli email shell:
 * gradient header bar, logo, content area, footer.
 */
function emailShell(opts: {
  preheader: string;   // hidden preview text in inbox
  innerHtml: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Famousli</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Hidden preheader (inbox preview) -->
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${opts.preheader}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background-color:${BRAND.white};border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(255,107,53,0.08),0 1px 3px rgba(0,0,0,0.04);">

          <!-- Gradient header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.accent} 50%,${BRAND.secondary} 100%);height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 32px 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent},${BRAND.secondary});border-radius:11px;text-align:center;line-height:42px;color:${BRAND.white};font-weight:900;font-size:22px;">F</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:${BRAND.dark};">Famous<span style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent},${BRAND.secondary});-webkit-background-clip:text;background-clip:text;color:transparent;">li</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 32px 40px 32px;">
              ${opts.innerHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F5;padding:24px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
              <p style="margin:0 0 8px 0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
                Famousli — AI-powered ads in 30 seconds
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.5;">
                You're receiving this because you signed up at <a href="https://famousli.vercel.app" style="color:${BRAND.primary};text-decoration:none;">famousli.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Magic link sign-in / sign-up email.
 * Used by NextAuth's EmailProvider.
 */
export function magicLinkEmail(params: {
  url: string;
  host: string;
  isNewUser?: boolean;
}): { subject: string; html: string; text: string } {
  const greeting = params.isNewUser
    ? "Welcome to Famousli! 🎉"
    : "Sign in to Famousli";
  const subline = params.isNewUser
    ? "You're one click away from creating your first AI ad."
    : "Click the button below to sign in. This link expires in 10 minutes.";

  const innerHtml = `
    <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:800;color:${BRAND.dark};line-height:1.2;letter-spacing:-0.5px;">
      ${greeting}
    </h1>
    <p style="margin:0 0 28px 0;font-size:16px;color:${BRAND.textMuted};line-height:1.6;">
      ${subline}
    </p>

    <!-- CTA button (table-based for email client compatibility) -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.accent} 100%);border-radius:14px;box-shadow:0 4px 14px rgba(255,107,53,0.35);">
                <a href="${params.url}" target="_blank" style="display:inline-block;padding:16px 40px;color:${BRAND.white};text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  ${params.isNewUser ? "Create my account →" : "Sign in to Famousli →"}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Backup link -->
    <p style="margin:32px 0 8px 0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;text-align:center;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 32px 0;text-align:center;">
      <a href="${params.url}" style="font-size:12px;color:${BRAND.primary};word-break:break-all;text-decoration:underline;font-family:'SF Mono',Monaco,'Courier New',monospace;">${params.url}</a>
    </p>

    <!-- What you can do (only for new users) -->
    ${
      params.isNewUser
        ? `
    <div style="background-color:#FFF8F4;border:1px solid #FFE4D6;border-radius:14px;padding:20px;margin-top:8px;">
      <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:${BRAND.dark};text-transform:uppercase;letter-spacing:0.5px;">
        ✨ What you can do with Famousli
      </p>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.8;">
        <li>Generate professional ads in 30 seconds</li>
        <li>Choose from 22+ AI actors for talking-head ads</li>
        <li>Edit copy, images, voice, and music in Studio</li>
        <li>Auto-post to TikTok, Instagram, Facebook, and more</li>
      </ul>
    </div>
    `
        : ""
    }

    <!-- Security note -->
    <p style="margin:28px 0 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;text-align:center;">
      🔒 If you didn't request this email, you can safely ignore it.<br>
      Your account stays secure.
    </p>
  `;

  const html = emailShell({
    preheader: params.isNewUser
      ? "Welcome to Famousli — click to activate your account"
      : "Sign in to Famousli with this magic link",
    innerHtml,
  });

  // Plain-text fallback for clients that don't render HTML
  const text = `${greeting}

${subline}

Click the link below to sign in:
${params.url}

If you didn't request this email, you can safely ignore it.

— The Famousli Team
https://famousli.vercel.app
`;

  const subject = params.isNewUser
    ? "🎉 Welcome to Famousli — confirm your email"
    : "Your Famousli sign-in link";

  return { subject, html, text };
}
