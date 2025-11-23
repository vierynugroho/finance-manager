"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ADMIN_EMAIL, ADMIN_EMAILS } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminUserSummary {
  userId: string;
  income: number;
  expense: number;
  balance: number;
  transactionsCount: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AdminSummaryResponse {
  users: AdminUser[];
  stats: AdminUserSummary[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (
      !session?.user ||
      !session.user.email ||
      !ADMIN_EMAILS?.includes(session.user.email)
    ) {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/admin/summary");
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to load admin summary", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, status, router]);

  if (
    !session?.user ||
    !session.user.email ||
    (ADMIN_EMAILS && !ADMIN_EMAILS.includes(session.user.email))
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav user={session.user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of users and their transaction activity.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : !data || data.users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No users found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => {
                    const stat = data.stats.find((s) => s.userId === user.id);
                    const income = stat?.income ?? 0;
                    const expense = stat?.expense ?? 0;
                    const balance = stat?.balance ?? income - expense;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat?.transactionsCount ?? 0}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {income.toLocaleString(undefined, {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {expense.toLocaleString(undefined, {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              balance >= 0
                                ? "border-emerald-500 text-emerald-600"
                                : "border-red-500 text-red-600"
                            }
                          >
                            {balance.toLocaleString(undefined, {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            })}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
