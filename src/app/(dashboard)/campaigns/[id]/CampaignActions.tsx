"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Campaign = {
  id: string;
  name: string;
  objective: string | null;
  budget: number | null;
  status: string;
};

const OBJECTIVES = ["awareness", "traffic", "conversions", "sales"] as const;
const STATUSES = ["draft", "active", "paused", "completed"] as const;

export function CampaignActions({ campaign: initial }: { campaign: Campaign }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [campaign, setCampaign] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    name: campaign.name,
    objective: (campaign.objective ?? "traffic") as string,
    budget: campaign.budget?.toString() ?? "",
    status: campaign.status,
  });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          objective: draft.objective,
          budget: draft.budget ? Number(draft.budget) : null,
          status: draft.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setCampaign({
        ...campaign,
        name: draft.name,
        objective: draft.objective,
        budget: draft.budget ? Number(draft.budget) : null,
        status: draft.status,
      });
      setEditing(false);
      success("Campaign updated");
      router.refresh();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      success("Campaign deleted");
      router.push("/campaigns");
    } catch (err) {
      error((err as Error).message);
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mb-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Campaign name
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Objective
            </label>
            <select
              value={draft.objective}
              onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary capitalize"
            >
              {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Status
            </label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary capitalize"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Budget
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={draft.budget}
                onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                placeholder="No budget"
                className="w-full rounded-xl border-2 border-black/10 bg-white pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            disabled={saving || !draft.name.trim()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={() => { setEditing(false); setDraft({ name: campaign.name, objective: campaign.objective ?? "traffic", budget: campaign.budget?.toString() ?? "", status: campaign.status }); }}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-2">
      <button
        onClick={() => setEditing(true)}
        className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      {confirmDelete ? (
        <>
          <span className="text-xs text-text-secondary">Are you sure?</span>
          <button
            onClick={remove}
            disabled={saving}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-semibold text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {saving ? "Deleting..." : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex h-9 items-center rounded-xl border-2 border-black/10 bg-white px-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-danger/20 bg-danger/5 px-3 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      )}
    </div>
  );
}
