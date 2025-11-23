"use client"

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/lib/use-currency";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [monthlyEmailEnabled, setMonthlyEmailEnabled] = useState<
    boolean | null
  >(null);
  const [savingMonthly, setSavingMonthly] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setMonthlyEmailEnabled(data.monthlyEmailEnabled);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    if (session?.user) {
      fetchSettings();
    }
  }, [session?.user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // In a real app, you'd implement profile update API
    setTimeout(() => {
      setMessage("Profile updated successfully!");
      setLoading(false);
    }, 1000);
  };

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Nav user={session.user} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={session.user.name || ""}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={session.user.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Preferred currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR – Indonesian Rupiah</SelectItem>
                    <SelectItem value="USD">USD – US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR – Euro</SelectItem>
                    <SelectItem value="SGD">SGD – Singapore Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used to format amounts across the app. Data is still stored in
                  the same base currency.
                </p>
              </div>
              {message && (
                <div className="text-sm text-green-600">{message}</div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Your theme preference is managed in the navigation bar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the theme toggle in the navigation bar to switch between light
              and dark modes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Reports</CardTitle>
            <CardDescription>
              Atur pengiriman email laporan bulanan (setiap tanggal 1 untuk
              bulan sebelumnya).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Laporan bulanan via email</p>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, kamu akan menerima ringkasan transaksi bulan lalu
                  setiap tanggal 1.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {monthlyEmailEnabled ? "Aktif" : "Tidak aktif"}
                </span>
                <Switch
                  checked={monthlyEmailEnabled ?? false}
                  disabled={monthlyEmailEnabled === null || savingMonthly}
                  onCheckedChange={async (checked: boolean) => {
                    if (monthlyEmailEnabled === null) return;
                    setSavingMonthly(true);
                    try {
                      const res = await fetch("/api/settings/notifications", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ monthlyEmailEnabled: checked }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setMonthlyEmailEnabled(data.monthlyEmailEnabled);
                      }
                    } catch (error) {
                      console.error(
                        "Failed to update monthly email setting:",
                        error
                      );
                    } finally {
                      setSavingMonthly(false);
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This feature is coming soon
            </p>
          </CardContent>
        </Card>

        {/* copyright by viery nugroho - vnonymous */}
        <footer className="text-center text-xs text-muted-foreground py-4">
          &copy; {new Date().getFullYear()} Finance Manager. All rights
          reserved. Developed by Viery Nugroho - Vnonymous.
        </footer>
      </main>
    </div>
  );
}
