"use client";

import { SceneEditor } from "@/components/studio/SceneEditor";

/**
 * Drop-in panel that adds the ecommerce scene editor to the existing Studio page.
 * Only renders when the ad has scene rows (the new ecommerce flow).
 */
export function StudioScenesPanel({ adId, hasScenes }: { adId: string; hasScenes: boolean }) {
  if (!hasScenes) return null;
  return (
    <div className="mb-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">Scenes</h2>
        <p className="text-sm text-text-secondary mt-1">
          Each scene generates separately. Click <span className="font-semibold text-primary">Edit with instruction</span> to refine any scene without rewriting the prompt — just tell AI what to change.
        </p>
      </div>
      <SceneEditor adId={adId} />
    </div>
  );
}
