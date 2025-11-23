import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month"
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const recentPage = parseInt(searchParams.get("recentPage") || "1")
    const recentLimit = parseInt(searchParams.get("recentLimit") || "5")

    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (startDateParam || endDateParam) {
      // Custom date range overrides period
      startDate = startDateParam ? new Date(startDateParam) : startOfMonth(now)
      endDate = endDateParam ? new Date(endDateParam) : endOfMonth(now)
    } else {
      switch (period) {
        case "year":
          startDate = startOfYear(now)
          endDate = endOfMonth(now)
          break
        case "month":
        default:
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
      }
    }

    // Get current period totals
    const [incomeTotal, expenseTotal] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: "INCOME",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: "EXPENSE",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      }),
    ])

    const income = incomeTotal._sum.amount || 0
    const expense = expenseTotal._sum.amount || 0
    const balance = income - expense

    // Get expenses by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    })

    const categoryIds = expensesByCategory.map((e) => e.categoryId)
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
    })

    const expensesByCategoryWithNames = expensesByCategory.map((expense) => {
      const category = categories.find((c) => c.id === expense.categoryId)
      return {
        category: category?.name || "Unknown",
        amount: expense._sum.amount || 0,
        color: category?.color || "#3b82f6",
      }
    })

    // Get last 6 months trend (based on endDate so it follows the selected range)
    const monthlyTrend = []
    const trendBaseDate = endDate
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(trendBaseDate, i))
      const monthEnd = endOfMonth(subMonths(trendBaseDate, i))

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: "INCOME",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: "EXPENSE",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ])

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        income: monthIncome._sum.amount || 0,
        expense: monthExpense._sum.amount || 0,
      })
    }

    // Recent transactions (respect the same date range + pagination)
    const [recentTransactions, recentTotal] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
        orderBy: { date: "desc" },
        skip: (recentPage - 1) * recentLimit,
        take: recentLimit,
      }),
      prisma.transaction.count({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ])

    return NextResponse.json({
      summary: {
        income,
        expense,
        balance,
      },
      expensesByCategory: expensesByCategoryWithNames,
      monthlyTrend,
      recentTransactions,
      recentPagination: {
        total: recentTotal,
        page: recentPage,
        limit: recentLimit,
        totalPages: Math.ceil(recentTotal / recentLimit),
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
