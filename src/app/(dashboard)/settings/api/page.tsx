"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Key, Plus, Trash2, Copy, Check, Lock, ArrowLeft, Shield } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
};

export default function ApiKeysPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("Default");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/api-keys").then((r) => r.json()).then((d) => {
      if (d.error) return;
      setKeys(d.keys ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowNewKey(data.key);
      setNewKeyName("Default");
      // Refresh list
      const listRes = await fetch("/api/api-keys");
      const listData = await listRes.json();
      setKeys(listData.keys ?? []);
    } catch (err) { error((err as Error).message); }
    finally { setCreating(false); }
  }

  async function deleteKey(id: string) {
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setKeys((prev) => prev.filter((k) => k.id !== id));
      success("API key revoked");
    } catch (err) { error((err as Error).message); }
  }

  function copyKey() {
    if (showNewKey) navigator.clipboard.writeText(showNewKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">API Keys</h1>
        <p className="text-text-secondary">Manage keys for the Famousli REST API</p>
      </div>

      {/* New key reveal */}
      {showNewKey && (
        <div className="rounded-2xl border-2 border-warning/30 bg-warning/5 p-5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-text-primary mb-1">Save your API key now</div>
              <p className="text-xs text-text-secondary mb-3">You won&apos;t be able to see this key again after closing this.</p>
              <div className="flex gap-2">
                <code className="flex-1 rounded-lg bg-white border border-black/10 px-3 py-2 text-xs font-mono text-text-primary break-all">
                  {showNewKey}
                </code>
                <button onClick={copyKey} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <button onClick={() => setShowNewKey(null)} className="mt-3 text-xs font-semibold text-text-secondary hover:text-text-primary">
                I&apos;ve saved it — close this
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create key */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">Create new key</h3>
        <div className="flex gap-3">
          <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name" className="flex-1 rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button onClick={createKey} disabled={creating}
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            <Plus className="h-4 w-4" /> {creating ? "Creating..." : "Create key"}
          </button>
        </div>
      </div>

      {/* Keys list */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">Your keys</h3>
        {loading ? (
          <p className="text-sm text-text-secondary py-4 text-center">Loading...</p>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center">
            <Key className="mx-auto h-10 w-10 text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary">No API keys yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-text-secondary" />
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{k.name}</div>
                    <div className="text-xs text-text-secondary font-mono">{k.prefix}••••••••</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-text-secondary">
                    <div>{k.usageCount.toLocaleString()} requests</div>
                    <div>{k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "Never used"}</div>
                  </div>
                  <button onClick={() => deleteKey(k.id)} className="text-danger hover:bg-danger/10 rounded-lg p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API docs preview */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">Quick start</h3>
        <pre className="rounded-xl bg-bg-dark p-4 text-xs text-text-light font-mono overflow-x-auto">
{`curl -X POST https://your-domain.com/api/v1/ads \\
  -H "Authorization: Bearer adg_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "businessInput": "I sell handmade candles",
    "platforms": ["INSTAGRAM", "FACEBOOK"],
    "numVariants": 3
  }'`}
        </pre>
      </div>
    </div>
  );
}
