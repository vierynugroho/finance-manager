"use client"

import { useEffect, useMemo, useState } from "react"
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

  useEffect(() => {
    fetchTransactions()
  }, [filterType, categoryFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== "all") params.append("type", filterType)
      if (categoryFilter !== "all" && categoryFilter) params.append("categoryId", categoryFilter)
      if (dateFrom) params.append("startDate", new Date(dateFrom).toISOString())
      if (dateTo) params.append("endDate", new Date(dateTo).toISOString())

      const res = await fetch(`/api/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const numericAmount = parseFloat(amountInput)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount greater than 0")
      return
    }

    const formData = new FormData(e.currentTarget)
    
    const data = {
      amount: numericAmount,
      description: formData.get("description") as string,
      date: new Date(formData.get("date") as string).toISOString(),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      categoryId: formData.get("categoryId") as string,
    }

    try {
      const url = editingId ? `/api/transactions/${editingId}` : "/api/transactions"
      const method = editingId ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setDialogOpen(false)
        setEditingId(null)
        fetchTransactions()
      }
    } catch (error) {
      console.error("Failed to save transaction:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        !searchQuery ||
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [transactions, searchQuery])

  const totals = useMemo(
    () =>
      filteredTransactions.reduce(
        (acc, tx) => {
          if (tx.type === "INCOME") {
            acc.income += tx.amount
          } else {
            acc.expense += tx.amount
          }
          return acc
        },
        { income: 0, expense: 0 }
      ),
    [filteredTransactions]
  )

  const balance = totals.income - totals.expense

  if (!session?.user) return null

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingId(null)} className="w-full sm:w-auto">
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
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    required
                    placeholder="0"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value.replace(",", "."))}
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
                        ? transactions.find((t) => t.id === editingId)?.category.id
                        : undefined
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                              transactions.find((t) => t.id === editingId)!.date
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
                        ? transactions.find((t) => t.id === editingId)?.description ?? ""
                        : ""
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Add"} Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* High-level summary for current filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Income"
            value={formatCurrency(totals.income)}
            icon={ArrowUpCircle}
            color="text-green-600"
          />
          <StatsCard
            title="Total Expense"
            value={formatCurrency(totals.expense)}
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterType === "INCOME" ? "default" : "outline"}
              onClick={() => setFilterType("INCOME")}
            >
              Income
            </Button>
            <Button
              size="sm"
              variant={filterType === "EXPENSE" ? "default" : "outline"}
              onClick={() => setFilterType("EXPENSE")}
            >
              Expenses
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
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
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="search"
              placeholder="Search description or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : filteredTransactions.length > 0 ? (
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
                        {format(new Date(transaction.date), "MMM dd, yyyy HH:mm")}
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
                          {transaction.type === "INCOME" ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit transaction"
                            onClick={() => {
                              setEditingId(transaction.id)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete transaction"
                            onClick={() => handleDelete(transaction.id)}
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
                  {filteredTransactions.length === 1 ? "" : "s"} for the
                  selected filters.
                </TableCaption>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found for the selected filters. Try adjusting the
                date range or category, or add your first transaction.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
