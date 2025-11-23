"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface RecentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  recentPagination: RecentPagination;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { currency } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [singleDate, setSingleDate] = useState<string>("");
  const [recentPage, setRecentPage] = useState<number>(1);
  const [recentLimit, setRecentLimit] = useState<number>(5);

  useEffect(() => {
    fetchStats();
  }, [period, startDate, endDate, recentPage, recentLimit]);

  const applyMonthFilter = (value: string) => {
    setMonthFilter(value);
    setSingleDate("");
    if (!value) {
      setStartDate("");
      setEndDate("");
      setRecentPage(1);
      return;
    }
    const [year, month] = value.split("-");
    const firstDay = new Date(Number(year), Number(month) - 1, 1);
    const lastDay = new Date(Number(year), Number(month), 0);
    const start = firstDay.toISOString().slice(0, 10);
    const end = lastDay.toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
    setRecentPage(1);
  };

  const applySingleDateFilter = (value: string) => {
    setSingleDate(value);
    setMonthFilter("");
    if (!value) {
      setStartDate("");
      setEndDate("");
      setRecentPage(1);
      return;
    }
    setStartDate(value);
    setEndDate(value);
    setRecentPage(1);
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append("period", period);
      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append("endDate", new Date(endDate).toISOString());
      }
      params.append("recentPage", String(recentPage));
      params.append("recentLimit", String(recentLimit));

      const res = await fetch(`/api/stats?${params.toString()}`);
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

  const formatDateInput = (value: string) => value;

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
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium">Period:</span>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      variant={period === "month" ? "default" : "outline"}
                      onClick={() => {
                        setPeriod("month");
                        // reset custom range & specific date/month
                        setStartDate("");
                        setEndDate("");
                        setMonthFilter("");
                        setSingleDate("");
                        setRecentPage(1);
                      }}
                    >
                      This Month
                    </Button>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      variant={period === "year" ? "default" : "outline"}
                      onClick={() => {
                        setPeriod("year");
                        // reset custom range & specific date/month
                        setStartDate("");
                        setEndDate("");
                        setMonthFilter("");
                        setSingleDate("");
                        setRecentPage(1);
                      }}
                    >
                      This Year
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Custom range
                    </p>
                    <div className="flex gap-2">
                      <Input
                        className="cursor-pointer"
                        type="date"
                        value={formatDateInput(startDate)}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setRecentPage(1);
                        }}
                      />
                      <Input
                        className="cursor-pointer"
                        type="date"
                        value={formatDateInput(endDate)}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setRecentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Specific month
                    </p>
                    <Input
                      className="cursor-pointer"
                      type="month"
                      value={monthFilter}
                      onChange={(e) => applyMonthFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Specific date
                    </p>
                    <Input
                      className="cursor-pointer"
                      type="date"
                      value={singleDate}
                      onChange={(e) => applySingleDateFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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
              <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Monthly Trend (Last 6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={stats.monthlyTrend}
                      margin={{ top: 16, right: 8, bottom: 24, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                        width={45}
                        tickFormatter={(value: number) =>
                          new Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 1,
                          }).format(value)
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconSize={12}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Income"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Expense"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {stats.expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.expensesByCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                          style={{ fontSize: "11px" }}
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
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No expense data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between mx-2 items-center">
                  <CardTitle>Recent Transactions</CardTitle>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent transactions per page
                    </p>
                    <Select
                      value={String(recentLimit)}
                      onValueChange={(value) => {
                        const next = Number(value);
                        setRecentLimit(next);
                        setRecentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[80px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 31].map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentTransactions.length > 0 ? (
                  <>
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
                              style={{
                                borderColor: transaction.category.color,
                              }}
                            >
                              {transaction.category.name}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {stats.recentPagination.page} of{" "}
                        {stats.recentPagination.totalPages} · Limit{" "}
                        {stats.recentPagination.limit}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <Button
                          className="cursor-pointer"
                          size="sm"
                          variant="outline"
                          disabled={stats.recentPagination.page <= 1}
                          onClick={() =>
                            setRecentPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          className="cursor-pointer"
                          size="sm"
                          variant="outline"
                          disabled={
                            stats.recentPagination.page >=
                            stats.recentPagination.totalPages
                          }
                          onClick={() =>
                            setRecentPage((prev) =>
                              Math.min(
                                stats.recentPagination.totalPages,
                                prev + 1
                              )
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
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
