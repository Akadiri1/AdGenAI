import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { FinanceClient } from "./FinanceClient";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  await requireAdmin();

  try {
    const [transactions, totalRevenue, last30Revenue, expenses, totalExpenses, last30Expenses] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      prisma.transaction.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { status: "completed", createdAt: { gte: new Date(Date.now() - 30 * 86400 * 1000) } },
        _sum: { amount: true },
      }),
      prisma.apiExpense.findMany({ orderBy: { purchasedAt: "desc" }, take: 200 }),
      prisma.apiExpense.aggregate({ _sum: { amount: true } }),
      prisma.apiExpense.aggregate({
        where: { purchasedAt: { gte: new Date(Date.now() - 30 * 86400 * 1000) } },
        _sum: { amount: true },
      }),
    ]);

    const revenueTotal = totalRevenue._sum.amount ?? 0;
    const expensesTotal = totalExpenses._sum.amount ?? 0;
    const profit = revenueTotal - expensesTotal;
    const last30Profit = (last30Revenue._sum.amount ?? 0) - (last30Expenses._sum.amount ?? 0);

    return (
      <FinanceClient
        initialTransactions={transactions.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        }))}
        initialExpenses={expenses.map((e) => ({
          ...e,
          purchasedAt: e.purchasedAt.toISOString(),
          createdAt: e.createdAt.toISOString(),
        }))}
        summary={{
          revenueTotal,
          expensesTotal,
          profit,
          last30Revenue: last30Revenue._sum.amount ?? 0,
          last30Expenses: last30Expenses._sum.amount ?? 0,
          last30Profit,
        }}
      />
    );
  } catch (error: any) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-red-600 mb-4">Database Error on Finance Page</h2>
        <p className="text-sm text-red-500 bg-white p-4 rounded border text-left overflow-auto font-mono whitespace-pre-wrap">
          {error.message || "Unknown error occurred"}
        </p>
      </div>
    );
  }
}
