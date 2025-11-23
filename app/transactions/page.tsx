"use client"

import { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx";
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table"
import { StatsCard } from "@/components/stats-card"
import { useCurrency } from "@/lib/use-currency"
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"

interface Transaction {
  id: string
  amount: number
  description: string | null
  date: string
  type: "INCOME" | "EXPENSE"
  category: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Summary {
  income: number;
  expense: number;
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const { currency } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [amountInput, setAmountInput] = useState<string>("")
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0 });

  // Prefill amount when editing an existing transaction
  useEffect(() => {
    if (!editingId) {
      setAmountInput("")
      return
    }

    const tx = transactions.find((t) => t.id === editingId)
    if (tx) {
      setAmountInput(String(tx.amount))
    }
  }, [editingId, transactions])

  useEffect(() => {
    fetchTransactions();
  }, [filterType, categoryFilter, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (categoryFilter !== "all" && categoryFilter)
        params.append("categoryId", categoryFilter);
      if (dateFrom)
        params.append("startDate", new Date(dateFrom).toISOString());
      if (dateTo) params.append("endDate", new Date(dateTo).toISOString());
      params.append("page", page.toString());
      params.append("limit", String(limit));

      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (data.summary) {
          setSummary({
            income: data.summary.income || 0,
            expense: data.summary.expense || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (categoryFilter !== "all" && categoryFilter)
        params.append("categoryId", categoryFilter);
      if (dateFrom)
        params.append("startDate", new Date(dateFrom).toISOString());
      if (dateTo) params.append("endDate", new Date(dateTo).toISOString());
      params.append("limit", "10000");

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const rows = (data.transactions as Transaction[]).map((tx) => ({
        Date: format(new Date(tx.date), "yyyy-MM-dd HH:mm"),
        Description: tx.description || tx.category.name,
        Category: tx.category.name,
        Type: tx.type,
        Amount: tx.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(
        workbook,
        `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Failed to export transactions:", error);
    }
  };

  const normalizeAmountInput = (raw: string): string => {
    // Treat "." as thousands separator and "," as decimal (common in ID),
    // but store as a plain number string with "." as the decimal separator.
    const withoutSpaces = raw.replace(/\s+/g, "")
    const standardized = withoutSpaces
      .replace(/\./g, "") // remove thousands separators
      .replace(/,/g, ".") // use dot as decimal separator

    // Keep only digits and at most one dot
    const cleaned = standardized.replace(/[^0-9.]/g, "")
    const parts = cleaned.split(".")
    if (parts.length <= 2) return cleaned

    return `${parts[0]}.${parts.slice(1).join("")}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numericAmount = parseFloat(normalizeAmountInput(amountInput));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const data = {
      amount: numericAmount,
      description: formData.get("description") as string,
      date: new Date(formData.get("date") as string).toISOString(),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      categoryId: formData.get("categoryId") as string,
    };

    try {
      const url = editingId
        ? `/api/transactions/${editingId}`
        : "/api/transactions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditingId(null);
        setAmountInput("");
        fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const balance = summary.income - summary.expense;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        !searchQuery ||
        transaction.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transaction.category.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [transactions, searchQuery]);
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Nav user={session.user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">
              Manage and review all your income and expenses in one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="cursor-pointer"
            >
              Export Excel
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingId(null)}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Transaction" : "Add New Transaction"}
                  </DialogTitle>
                </DialogHeader>
                {/* When editing, we pre-fill fields via defaultValue and a changing key */}
                <form
                  key={editingId ?? "new"}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      name="type"
                      required
                      defaultValue={
                        editingId
                          ? transactions.find((t) => t.id === editingId)?.type
                          : undefined
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) =>
                        setAmountInput(normalizeAmountInput(e.target.value))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {amountInput
                        ? `≈ ${formatCurrency(Number(amountInput) || 0)}`
                        : "Enter an amount to see it formatted here"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      name="categoryId"
                      required
                      defaultValue={
                        editingId
                          ? transactions.find((t) => t.id === editingId)
                              ?.category.id
                          : undefined
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent
                        searchable
                        searchPlaceholder="Search category..."
                      >
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="datetime-local"
                      required
                      defaultValue={
                        editingId
                          ? format(
                              new Date(
                                transactions.find(
                                  (t) => t.id === editingId
                                )!.date
                              ),
                              "yyyy-MM-dd'T'HH:mm"
                            )
                          : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      placeholder="e.g., Salary, Groceries"
                      defaultValue={
                        editingId
                          ? transactions.find((t) => t.id === editingId)
                              ?.description ?? ""
                          : ""
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer">
                    {editingId ? "Update" : "Add"} Transaction
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* High-level summary for current filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Income"
            value={formatCurrency(summary.income)}
            icon={ArrowUpCircle}
            color="text-green-600"
          />
          <StatsCard
            title="Total Expense"
            value={formatCurrency(summary.expense)}
            icon={ArrowDownCircle}
            color="text-red-600"
          />
          <StatsCard
            title="Net Balance"
            value={formatCurrency(balance)}
            icon={Wallet}
            color={balance >= 0 ? "text-green-600" : "text-red-600"}
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              className="cursor-pointer"
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => {
                setFilterType("all");
                setPage(1);
              }}
            >
              All
            </Button>
            <Button
              className="cursor-pointer"
              size="sm"
              variant={filterType === "INCOME" ? "default" : "outline"}
              onClick={() => {
                setFilterType("INCOME");
                setPage(1);
              }}
            >
              Income
            </Button>
            <Button
              className="cursor-pointer"
              size="sm"
              variant={filterType === "EXPENSE" ? "default" : "outline"}
              onClick={() => {
                setFilterType("EXPENSE");
                setPage(1);
              }}
            >
              Expenses
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent
                searchable
                searchPlaceholder="Search categories..."
              >
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />

            <Input
              type="search"
              placeholder="Search description or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:col-span-2 lg:col-span-1"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading...
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(
                            new Date(transaction.date),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description || transaction.category.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ borderColor: transaction.category.color }}
                          >
                            {transaction.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.type === "INCOME"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }
                          >
                            {transaction.type === "INCOME"
                              ? "Income"
                              : "Expense"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {transaction.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="icon"
                              aria-label="Edit transaction"
                              onClick={() => {
                                setEditingId(transaction.id);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete transaction"
                              onClick={() => handleDelete(transaction.id)}
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    Showing {filteredTransactions.length} transaction
                    {filteredTransactions.length === 1 ? "" : "s"} on this page
                    {pagination?.total
                      ? ` out of ${pagination.total} total for the selected filters.`
                      : "."}
                  </TableCaption>
                </Table>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination?.page ?? 1} of{" "}
                      {pagination?.totalPages ?? 1} · Limit {limit}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Per page</span>
                      <Select
                        value={String(limit)}
                        onValueChange={(value) => {
                          const next = Number(value);
                          setLimit(next);
                          setPage(1);
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
                  <div className="flex gap-2 justify-end">
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="outline"
                      disabled={!pagination || pagination.page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="outline"
                      disabled={
                        !pagination || pagination.page >= pagination.totalPages
                      }
                      onClick={() =>
                        setPage((prev) =>
                          pagination
                            ? Math.min(pagination.totalPages, prev + 1)
                            : prev + 1
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found for the selected filters. Try adjusting
                the date range or category, or add your first transaction.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
