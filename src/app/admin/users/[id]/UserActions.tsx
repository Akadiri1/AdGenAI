"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck, CreditCard, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const PLANS = ["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"];

export function UserActions({
  userId, isSuspended, isAdmin, currentPlan,
}: {
  userId: string; isSuspended: boolean; isAdmin: boolean; currentPlan: string;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function call(action: string, body?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      success(`${action} successful`);
      router.refresh();
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  async function changePlan(newPlan: string) {
    if (newPlan === currentPlan) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success(`Plan changed to ${newPlan}`);
      router.refresh();
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  async function deleteUser() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      success("User deleted");
      router.push("/admin/users");
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentPlan}
        onChange={(e) => changePlan(e.target.value)}
        disabled={loading}
        className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
      >
        {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <button
        onClick={() => call("credits", { credits: 100 })}
        disabled={loading}
        className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50"
      >
        <CreditCard className="h-3.5 w-3.5" /> +100 credits
      </button>

      <button
        onClick={() => call(isSuspended ? "unsuspend" : "suspend")}
        disabled={loading}
        className={`flex h-9 items-center gap-1.5 rounded-xl border-2 px-3 text-xs font-semibold disabled:opacity-50 ${
          isSuspended ? "border-success/20 bg-success/5 text-success" : "border-warning/20 bg-warning/5 text-warning"
        }`}
      >
        <Ban className="h-3.5 w-3.5" /> {isSuspended ? "Unsuspend" : "Suspend"}
      </button>

      <button
        onClick={() => call(isAdmin ? "demote" : "promote")}
        disabled={loading}
        className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary disabled:opacity-50"
      >
        <ShieldCheck className="h-3.5 w-3.5" /> {isAdmin ? "Remove admin" : "Make admin"}
      </button>

      {confirmDelete ? (
        <>
          <button
            onClick={deleteUser}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-danger px-3 text-xs font-semibold text-white"
          >
            <Trash2 className="h-3.5 w-3.5" /> Confirm
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold text-text-secondary px-2">Cancel</button>
        </>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-danger/20 bg-danger/5 px-3 text-xs font-semibold text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      )}
    </div>
  );
}
