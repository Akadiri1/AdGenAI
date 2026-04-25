/**
 * Single source of truth for support contact info.
 * Update here, propagates to footer, support page, in-app help bubble, and emails.
 */
export const CONTACT = {
  supportEmail: "support@famousli.com",
  salesEmail: "sales@famousli.com",

  // WhatsApp — Nigerian number (+234), used for direct support
  whatsappNumber: "+2347082783187",
  whatsappDisplay: "+234 708 278 3187",
  whatsappLink: "https://wa.me/2347082783187",

  // Socials — handle is consistent across platforms
  handle: "famouslihq",
  tiktokLink: "https://www.tiktok.com/@famouslihq",
  instagramLink: "https://www.instagram.com/famouslihq",
  youtubeLink: "https://www.youtube.com/@famouslihq",
} as const;
