import { NextRequest, NextResponse } from "next/server"
import { auth, ADMIN_EMAIL } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })

    const userIds = users.map((u) => u.id)

    if (userIds.length === 0) {
      return NextResponse.json({ users: [], stats: [] })
    }

    const aggregates = await prisma.transaction.groupBy({
      by: ["userId", "type"],
      where: {
        userId: { in: userIds },
      },
      _sum: { amount: true },
    })

    const counts = await prisma.transaction.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
      },
      _count: { _all: true },
    })

    const stats = users.map((user) => {
      const userAgg = aggregates.filter((a) => a.userId === user.id)
      const income =
        userAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0
      const expense =
        userAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0
      const totalCount =
        counts.find((c) => c.userId === user.id)?._count._all ?? 0

      return {
        userId: user.id,
        income,
        expense,
        balance: income - expense,
        transactionsCount: totalCount,
      }
    })

    return NextResponse.json({ users, stats })
  } catch (error) {
    console.error("Admin summary error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
