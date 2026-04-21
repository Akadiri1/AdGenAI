"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Mail, ExternalLink, Minus,
} from "lucide-react";
import {
  InstagramIcon, FacebookIcon, TikTokIcon, XTwitterIcon,
  WhatsAppIcon, LinkedInIcon, YouTubeIcon, DiscordIcon,
} from "@/components/icons/SocialIcons";

type SocialLink = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  sub: string;
  group: "chat" | "follow";
};

const SOCIAL_LINKS: SocialLink[] = [
  { name: "WhatsApp", icon: WhatsAppIcon, href: "https://wa.me/2348000000000", color: "hover:bg-green-500/10", sub: "Chat with us", group: "chat" },
  { name: "Discord", icon: DiscordIcon, href: "https://discord.gg/famousli", color: "hover:bg-indigo-500/10", sub: "Join community", group: "chat" },
  { name: "YouTube", icon: YouTubeIcon, href: "https://youtube.com/@famousli", color: "hover:bg-red-500/10", sub: "Tutorials & podcasts", group: "chat" },
  { name: "Instagram", icon: InstagramIcon, href: "https://instagram.com/famousli", color: "hover:bg-pink-500/10", sub: "Follow us", group: "follow" },
  { name: "X (Twitter)", icon: XTwitterIcon, href: "https://x.com/famousli", color: "hover:bg-gray-500/10", sub: "Follow us", group: "follow" },
  { name: "Facebook", icon: FacebookIcon, href: "https://facebook.com/famousli", color: "hover:bg-blue-500/10", sub: "Follow us", group: "follow" },
  { name: "LinkedIn", icon: LinkedInIcon, href: "https://linkedin.com/company/famousli", color: "hover:bg-blue-700/10", sub: "Follow us", group: "follow" },
  { name: "TikTok", icon: TikTokIcon, href: "https://tiktok.com/@famousli", color: "hover:bg-pink-500/10", sub: "Follow us", group: "follow" },
];

export function SupportBubble() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<"chat" | "socials">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hey! 👋 Got questions about Famousli? Ask me anything — how to create ads, billing, features, connecting accounts, etc." },
  ]);
  const [sending, setSending] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load hidden state from session storage
  useEffect(() => {
    const isHidden = sessionStorage.getItem("hide_support_bubble") === "true";
    if (isHidden) setHidden(true);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function handleHide(e: React.MouseEvent) {
    e.stopPropagation();
    setHidden(true);
    sessionStorage.setItem("hide_support_bubble", "true");
  }

  async function sendMessage() {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMsg }]);
    setMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `The user asked this question about Famousli (an AI ad creation platform): "${userMsg}". Give a helpful, concise answer in 2-3 sentences. If you don't know, say "I'll connect you with our team — reach out via WhatsApp or email for faster help."`,
          fieldType: "generic",
          mode: "generate",
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setMessages((prev) => [...prev, { from: "bot", text: data.text }]);
      } else {
        setMessages((prev) => [...prev, { from: "bot", text: "I'll connect you with our team — reach out via WhatsApp or email below for faster help!" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Something went wrong. Please try reaching us on WhatsApp or email!" }]);
    } finally {
      setSending(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Drag boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[149]" />

      {/* Floating draggable bubble */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-20 sm:bottom-6 right-6 z-[150] flex flex-col items-end gap-2"
          >
            {/* Tiny close button above the bubble */}
            <button
              onClick={handleHide}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-text-secondary backdrop-blur-md hover:bg-danger hover:text-white transition-all shadow-sm"
              title="Hide for this session"
            >
              <X className="h-3 w-3" />
            </button>
            
            <motion.button
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              onClick={() => setOpen(true)}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-110">
                <MessageCircle className="h-6 w-6" />
                <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[8px] font-bold text-white">
                  1
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-14 sm:bottom-6 right-0 sm:right-6 z-[150] w-full sm:w-[380px] h-[60vh] sm:h-[460px] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-black/10 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-warning p-4 text-white">
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-heading font-bold">Famousli Support</div>
                  <div className="text-xs text-white/80">We typically reply instantly</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleHide}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-danger/20 transition-colors"
                  title="Hide for this session"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-black/5">
              <button
                onClick={() => setTab("chat")}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  tab === "chat" ? "border-b-2 border-primary text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Chat with us
              </button>
              <button
                onClick={() => setTab("socials")}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  tab === "socials" ? "border-b-2 border-primary text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Social media
              </button>
            </div>

            {tab === "chat" ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.from === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-bg-secondary text-text-primary rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-bg-secondary px-4 py-3 text-sm text-text-secondary">
                        <span className="inline-flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-black/5 p-3">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sending}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Social links */
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <p className="text-xs font-semibold text-primary mb-1">Chat, subscribe & get updates</p>
              <p className="text-[10px] text-text-secondary mb-3">
                Real-time support, community, tutorials & podcasts
              </p>
              {SOCIAL_LINKS.filter((s) => s.group === "chat").map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${s.color} mb-1`}
                    >
                      <Icon className="h-8 w-8 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-text-primary">{s.name}</div>
                        <div className="text-[10px] text-text-secondary">{s.sub}</div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-text-secondary" />
                    </a>
                  );
                })}

                <p className="text-xs font-semibold text-text-secondary mt-4 mb-2">Follow us</p>
                {SOCIAL_LINKS.filter((s) => s.group === "follow").map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${s.color}`}
                    >
                      <Icon className="h-8 w-8 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-text-primary">{s.name}</div>
                        <div className="text-[10px] text-text-secondary truncate">{s.href.replace("https://", "")}</div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-text-secondary" />
                    </a>
                  );
                })}

                <div className="mt-4 pt-3 border-t border-black/5">
                  <a
                    href="mailto:support@famousli.com"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-bg-secondary transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text-primary">Email us</div>
                      <div className="text-[10px] text-text-secondary">support@famousli.com</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-text-secondary" />
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
