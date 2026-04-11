"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Tx = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerId: string | null;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null } | null;
};

type Expense = {
  id: string;
  provider: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  purchasedAt: string;
  invoiceUrl: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

type Summary = {
  revenueTotal: number;
  expensesTotal: number;
  profit: number;
  last30Revenue: number;
  last30Expenses: number;
  last30Profit: number;
};

const PROVIDERS = ["groq", "gemini", "anthropic", "openai", "elevenlabs", "stripe", "vercel", "neon", "cloudflare-r2", "upstash", "twilio", "sendgrid", "other"];
const CATEGORIES = ["ai", "hosting", "storage", "email", "sms", "domain", "other"];

export function FinanceClient({
  initialTransactions, initialExpenses, summary,
}: {
  initialTransactions: Tx[]; initialExpenses: Expense[]; summary: Summary;
}) {
  const { success, error } = useToast();
  const [transactions] = useState(initialTransactions);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [tab, setTab] = useState<"all" | "revenue" | "expenses">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    provider: "groq",
    category: "ai",
    description: "",
    amount: "",
    purchasedAt: new Date().toISOString().slice(0, 16),
    invoiceUrl: "",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          purchasedAt: new Date(form.purchasedAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setExpenses([data.expense, ...expenses]);
      success("Expense logged");
      setShowForm(false);
      setForm({
        provider: "groq", category: "ai", description: "", amount: "",
        purchasedAt: new Date().toISOString().slice(0, 16),
        invoiceUrl: "", reference: "", notes: "",
      });
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/admin/expenses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setExpenses(expenses.filter((e) => e.id !== id));
      success("Deleted");
    } catch (err) {
      error((err as Error).message);
    }
  }

  // Build unified ledger
  const ledger = [
    ...transactions.map((t) => ({
      kind: "in" as const,
      id: t.id,
      date: t.createdAt,
      provider: t.provider,
      label: `${t.type} ${t.user?.email ? `from ${t.user.email}` : ""}`,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      meta: { userId: t.user?.id, providerId: t.providerId },
    })),
    ...expenses.map((e) => ({
      kind: "out" as const,
      id: e.id,
      date: e.purchasedAt,
      provider: e.provider,
      label: e.description ?? `${e.category} purchase`,
      amount: e.amount,
      currency: e.currency,
      status: e.category,
      meta: { invoiceUrl: e.invoiceUrl, reference: e.reference },
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = tab === "all" ? ledger
    : tab === "revenue" ? ledger.filter((l) => l.kind === "in")
    : ledger.filter((l) => l.kind === "out");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Financial Audit</h1>
          <p className="text-text-secondary text-sm">All money in and out — full audit trail with timestamps</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Log API expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Revenue</span>
          </div>
          <div className="font-heading text-2xl font-bold text-text-primary">${summary.revenueTotal.toFixed(2)}</div>
          <div className="text-xs text-text-secondary mt-1">${summary.last30Revenue.toFixed(2)} last 30d</div>
        </div>
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
          <div className="flex items-center gap-2 text-danger mb-2">
            <TrendingDown className="h-4 w-4" /><span className="text-xs font-semibold uppercase">API & Platform Costs</span>
          </div>
          <div className="font-heading text-2xl font-bold text-text-primary">${summary.expensesTotal.toFixed(2)}</div>
          <div className="text-xs text-text-secondary mt-1">${summary.last30Expenses.toFixed(2)} last 30d</div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <DollarSign className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Net Profit</span>
          </div>
          <div className={`font-heading text-2xl font-bold ${summary.profit >= 0 ? "text-success" : "text-danger"}`}>
            ${summary.profit.toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary mt-1">${summary.last30Profit.toFixed(2)} last 30d</div>
        </div>
      </div>

      {/* Add expense form */}
      {showForm && (
        <form onSubmit={addExpense} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-bold text-text-primary">Log API / platform purchase</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Provider / Platform</label>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Amount (USD)</label>
              <input
                type="number" step="0.01" required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Date & Time</label>
              <input
                type="datetime-local" required
                value={form.purchasedAt}
                onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-text-secondary">Description</label>
              <input
                type="text"
                placeholder="e.g. Groq API credits top-up"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Invoice / Receipt URL</label>
              <input
                type="url"
                value={form.invoiceUrl}
                onChange={(e) => setForm({ ...form, invoiceUrl: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Reference / Invoice #</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-text-secondary">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit" disabled={submitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save expense"}
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="rounded-xl border-2 border-black/10 px-4 py-2 text-sm font-semibold text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-bg-secondary p-1 w-fit">
        {(["all", "revenue", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize ${
              tab === t ? "bg-white text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Ledger table */}
      <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Date & Time</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Platform</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Amount</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-secondary">No records</td></tr>
              ) : filtered.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-t border-black/5 hover:bg-bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                    {new Date(row.date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {row.kind === "in" ? (
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">REVENUE</span>
                    ) : (
                      <span className="rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">EXPENSE</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-semibold uppercase text-xs">{row.provider}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {row.label}
                    {row.kind === "out" && row.meta.reference && (
                      <span className="ml-2 text-text-secondary">#{row.meta.reference}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${row.kind === "in" ? "text-success" : "text-danger"}`}>
                    {row.kind === "in" ? "+" : "−"}${row.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.kind === "out" && row.meta.invoiceUrl && (
                      <a href={row.meta.invoiceUrl} target="_blank" rel="noreferrer" className="inline-block mr-2 text-text-secondary hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {row.kind === "in" && row.meta.userId && (
                      <Link href={`/admin/users/${row.meta.userId}`} className="inline-block mr-2 text-text-secondary hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {row.kind === "out" && (
                      <button onClick={() => deleteExpense(row.id)} className="text-text-secondary hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
