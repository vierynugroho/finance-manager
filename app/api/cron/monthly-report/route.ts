import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendMonthlyReportEmail } from "@/lib/email";

// Optional simple protection: if CRON_SECRET is set, require Authorization: Bearer <CRON_SECRET>
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  try {
    if (CRON_SECRET) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const lastMonthDate = subMonths(now, 1);
    const start = startOfMonth(lastMonthDate);
    const end = endOfMonth(lastMonthDate);

    const users = await prisma.user.findMany({
      where: {
        monthlyEmailEnabled: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!users.length) {
      return NextResponse.json({ message: "No users with monthly emails enabled" });
    }

    const results: Array<{ userId: string; email: string; sent: boolean; error?: string }> = [];

    for (const user of users) {
      try {
        const [incomeAgg, expenseAgg, txCount] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: "INCOME",
              date: {
                gte: start,
                lte: end,
              },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: "EXPENSE",
              date: {
                gte: start,
                lte: end,
              },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              userId: user.id,
              date: {
                gte: start,
                lte: end,
              },
            },
          }),
        ]);

        const income = incomeAgg._sum.amount || 0;
        const expense = expenseAgg._sum.amount || 0;
        const balance = income - expense;

        const monthLabel = start.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        const subject = `Finance Manager - Laporan Bulan ${monthLabel}`;

        const text = [
          `Halo ${user.name || user.email},`,
          "",
          `Berikut ringkasan transaksi kamu untuk bulan ${monthLabel}:`,
          "",
          `- Total Pemasukan: ${income.toFixed(2)}`,
          `- Total Pengeluaran: ${expense.toFixed(2)}`,
          `- Saldo (Pemasukan - Pengeluaran): ${balance.toFixed(2)}`,
          `- Jumlah Transaksi: ${txCount}`,
          "",
          "Terima kasih telah menggunakan Finance Manager.",
        ].join("\n");

        const html = `
          <p>Halo ${user.name || user.email},</p>
          <p>Berikut ringkasan transaksi kamu untuk bulan <strong>${monthLabel}</strong>:</p>
          <ul>
            <li>Total Pemasukan: <strong>${income.toFixed(2)}</strong></li>
            <li>Total Pengeluaran: <strong>${expense.toFixed(2)}</strong></li>
            <li>Saldo (Pemasukan - Pengeluaran): <strong>${balance.toFixed(2)}</strong></li>
            <li>Jumlah Transaksi: <strong>${txCount}</strong></li>
          </ul>
          <p>Terima kasih telah menggunakan Finance Manager.</p>
        `;

        await sendMonthlyReportEmail({
          to: user.email,
          subject,
          text,
          html,
        });

        results.push({ userId: user.id, email: user.email, sent: true });
      } catch (error: any) {
        console.error("Failed to send monthly report email", { userId: user.id, error });
        results.push({
          userId: user.id,
          email: user.email,
          sent: false,
          error: error?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Monthly report processing done",
      start,
      end,
      results,
    });
  } catch (error) {
    console.error("Cron monthly-report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
