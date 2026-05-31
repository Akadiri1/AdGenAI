"use client";

import { X, FileText, CheckCircle2 } from "lucide-react";

export type AdTemplate = {
  id: string;
  name: string;
  description: string;
  content: string;
};

export const AD_TEMPLATES: AdTemplate[] = [
  {
    id: "tiktok-hook",
    name: "The TikTok Hook",
    description: "High energy. Starts with a bold claim, explains how, and ends with a soft CTA.",
    content: "Okay, if you struggle with [Problem], you NEED to hear this.\n\nI used to spend hours trying to fix it until I found [Product].\n\nIt literally does [Benefit 1] and [Benefit 2] in half the time.\n\nHonestly, it's a game changer. Link in bio to check it out."
  },
  {
    id: "pas",
    name: "Problem - Agitate - Solve",
    description: "Classic marketing framework. Focuses on the pain point before introducing the product.",
    content: "Tired of dealing with [Problem]? It's the worst, right?\n\nYou've probably tried [Alternative] and realized it just doesn't work.\n\nThat's why everyone is switching to [Product]. It completely eliminates the hassle by doing [Core Feature].\n\nStop stressing and grab yours today."
  },
  {
    id: "3-reasons",
    name: "3 Reasons Why",
    description: "Listicle style. Very popular for quick, snappy e-commerce ads.",
    content: "Here are 3 reasons why [Product] is completely selling out:\n\n1. It's incredibly easy to use.\n2. You get [Benefit] without any of the usual [Drawback].\n3. It's surprisingly affordable right now.\n\nDon't miss out, grab one before they're gone!"
  },
  {
    id: "story-confession",
    name: "The Confession",
    description: "Feels like a FaceTime call. High trust and high conversion.",
    content: "I have a confession to make. I was super skeptical about [Product] at first.\n\nBut after trying it for just a week? My mind is blown.\n\nMy [Pain Point] is completely gone, and I feel so much better.\n\nIf you're on the fence, just try it. You'll thank me later."
  }
];

export function TemplatesModal({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white dark:bg-[#151522] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Ad Script Templates
            </h2>
            <p className="text-sm text-text-secondary dark:text-white/60 mt-1">
              Select a proven marketing framework to start your script.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-secondary dark:hover:bg-white/10 text-text-secondary dark:text-white/60 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-bg-secondary/30 dark:bg-black/20 space-y-4">
          {AD_TEMPLATES.map((template) => (
            <div key={template.id} className="bg-white dark:bg-[#1e1e2e] rounded-2xl p-5 border border-black/5 dark:border-white/10 shadow-sm hover:border-primary/50 dark:hover:border-[#FF6B35]/50 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-text-primary dark:text-white text-lg">{template.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-white/50">{template.description}</p>
                </div>
                <button
                  onClick={() => {
                    onSelect(template.content);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" /> Use this
                </button>
              </div>
              <div className="bg-bg-secondary dark:bg-black/30 p-4 rounded-xl text-sm text-text-secondary dark:text-white/80 font-mono whitespace-pre-wrap">
                {template.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
