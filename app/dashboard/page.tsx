"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/use-currency";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface Stats {
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  expensesByCategory: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    description: string | null;
    date: string;
    type: string;
    category: {
      name: string;
      color: string;
    };
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { currency } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav user={session.user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}! Here&apos;s your financial
            overview.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Total Income"
                value={formatCurrency(stats.summary.income)}
                icon={ArrowUpCircle}
                color="text-green-600"
              />
              <StatsCard
                title="Total Expense"
                value={formatCurrency(stats.summary.expense)}
                icon={ArrowDownCircle}
                color="text-red-600"
              />
              <StatsCard
                title="Balance"
                value={formatCurrency(stats.summary.balance)}
                icon={Wallet}
                color={
                  stats.summary.balance >= 0 ? "text-green-600" : "text-red-600"
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Monthly Trend */}
              <Card className="col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Monthly Trend (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Income"
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Expense"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.expensesByCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => entry.accumulate}
                        >
                          {stats.expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No expense data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${
                              transaction.type === "INCOME"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                                : "bg-red-100 text-red-600 dark:bg-red-900/20"
                            }`}
                          >
                            {transaction.type === "INCOME" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {transaction.description ||
                                transaction.category.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(transaction.date),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              transaction.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <Badge
                            variant="outline"
                            style={{ borderColor: transaction.category.color }}
                          >
                            {transaction.category.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No transactions yet. Start by adding your first transaction!
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">Failed to load data</div>
        )}
      </main>
    </div>
  );
}
