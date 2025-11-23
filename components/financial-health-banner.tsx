"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

interface TopCategory {
  name: string;
  amount: number;
}

interface FinancialHealthBannerProps {
  summary: Summary;
  topCategory?: TopCategory | null;
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function FinancialHealthBanner({
  summary,
  topCategory,
  currency,
}: FinancialHealthBannerProps) {
  const { income, expense, balance } = summary;

  const todayLabel = format(new Date(), "PPP", { locale: id });

  let status: "good" | "warning" | "bad" | "neutral" = "neutral";
  let title = "Ringkasan kondisi keuangan";
  let advice = "Mulai catat transaksi secara rutin untuk mendapatkan insight yang lebih akurat.";

  if (income === 0 && expense === 0) {
    status = "neutral";
    title = "Belum ada aktivitas keuangan";
    advice =
      "Tambahkan pemasukan dan pengeluaran pertamamu untuk melihat analisis kondisi keuangan di sini.";
  } else {
    const spendingRatio = income > 0 ? expense / income : 1;

    if (balance < 0 || spendingRatio > 1) {
      status = "bad";
      title = "Kondisi keuangan berisiko";
      advice =
        "Pengeluaranmu melebihi pemasukan. Kurangi pengeluaran tidak penting, fokus lunasi utang, dan buat anggaran ketat untuk 1–3 bulan ke depan.";
    } else if (spendingRatio >= 0.7) {
      status = "warning";
      title = "Kondisi keuangan perlu diwaspadai";
      advice =
        "Pengeluaranmu mendekati pemasukan. Coba batasi pengeluaran konsumtif dan sisihkan minimal 10–20% dari pemasukan untuk tabungan atau dana darurat.";
    } else {
      status = "good";
      title = "Kondisi keuangan cukup sehat";
      advice =
        "Proporsi pengeluaranmu masih aman. Pertahankan kebiasaan baik ini dan pertimbangkan untuk menambah porsi investasi atau tabungan jangka panjang.";
    }
  }

  const statusStyles = {
    good: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-50",
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-50",
    bad: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-50",
    neutral:
      "bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-50",
  }[status];

  const Icon =
    status === "good" ? CheckCircle2 : status === "bad" ? AlertTriangle : Info;

  return (
    <section
      className={`w-full rounded-xl border px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${statusStyles}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="h-5 w-5 flex-shrink-0" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
            <Badge
              variant="outline"
              className="border-white/40 bg-white/10 text-xs backdrop-blur-sm"
            >
              {status === "good"
                ? "Sehat"
                : status === "warning"
                ? "Waspada"
                : status === "bad"
                ? "Berisiko"
                : "Netral"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{advice}</p>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] sm:text-xs opacity-90">
            <span>
              Pemasukan: <strong>{formatCurrency(income, currency)}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Pengeluaran: <strong>{formatCurrency(expense, currency)}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Saldo: <strong>{formatCurrency(balance, currency)}</strong>
            </span>
            {topCategory && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>
                  Pengeluaran terbesar: <strong>{topCategory.name}</strong> (
                  {formatCurrency(topCategory.amount, currency)})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-0 flex items-start sm:items-end justify-end sm:justify-start">
        <p className="text-[11px] sm:text-xs opacity-80 text-right sm:text-left">
          Update per <span className="font-medium">{todayLabel}</span>
        </p>
      </div>
    </section>
  );
}
