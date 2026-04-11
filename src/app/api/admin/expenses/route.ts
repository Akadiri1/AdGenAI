import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  provider: z.string().min(1),
  category: z.enum(["ai", "hosting", "storage", "email", "sms", "domain", "other"]).default("ai"),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  purchasedAt: z.string().optional(),
  invoiceUrl: z.string().url().optional().or(z.literal("")),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const expenses = await prisma.apiExpense.findMany({
    orderBy: { purchasedAt: "desc" },
    take: 500,
  });

  const byProvider = await prisma.apiExpense.groupBy({
    by: ["provider"],
    _sum: { amount: true },
    _count: true,
  });

  const byCategory = await prisma.apiExpense.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });

  const total = await prisma.apiExpense.aggregate({ _sum: { amount: true } });

  return NextResponse.json({
    expenses,
    summary: {
      total: total._sum.amount ?? 0,
      byProvider,
      byCategory,
    },
  });
}

export async function POST(req: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const expense = await prisma.apiExpense.create({
    data: {
      provider: body.provider,
      category: body.category,
      description: body.description,
      amount: body.amount,
      currency: body.currency,
      purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
      invoiceUrl: body.invoiceUrl || null,
      reference: body.reference,
      notes: body.notes,
      createdBy: admin.id,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "admin_action",
    resource: expense.id,
    metadata: {
      kind: "expense_logged",
      provider: body.provider,
      amount: body.amount,
      currency: body.currency,
    },
    ...getRequestContext(req),
  });

  return NextResponse.json({ success: true, expense });
}

export async function DELETE(req: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.apiExpense.delete({ where: { id } });
  await logAudit({
    userId: admin.id,
    action: "admin_action",
    resource: id,
    metadata: { kind: "expense_deleted" },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true });
}
