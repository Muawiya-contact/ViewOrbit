"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { useToastStore } from "@/lib/store/useToastStore";
import { useAuthContext } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/client/fetch-with-auth";

type PaymentMethodKey = "jazzcash" | "easypaisa";

interface PayoutRow {
  id: string;
  amount_points: number;
  amount_pkr: number;
  method: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface SettingsPayload {
  pointsPerUnit: number;
  pkrPerUnit: number;
  minPayoutPoints: number;
}

const defaultSettings: SettingsPayload = {
  pointsPerUnit: 1000,
  pkrPerUnit: 100,
  minPayoutPoints: 1000,
};

export function RedeemPayoutZone() {
  const { user } = useAuthContext();
  const showToast = useToastStore((state) => state.showToast);

  const [walletPoints, setWalletPoints] = useState(0);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRow[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [jazzCashInput, setJazzCashInput] = useState("");
  const [easyPaisaInput, setEasyPaisaInput] = useState("");

  const conversionLabel = `${settings.pointsPerUnit} Points = ${settings.pkrPerUnit} PKR`;
  const estimatedPkr = Math.floor((walletPoints / settings.pointsPerUnit) * settings.pkrPerUnit);

  const loadPayoutData = useCallback(async () => {
    if (!user) return;

    const [walletResponse, payoutsResponse] = await Promise.all([
      fetchWithAuth("/api/wallet", { maxRetries: 2 }),
      fetchWithAuth("/api/payouts", { maxRetries: 2 }),
    ]);

    if (walletResponse.ok) {
      const walletPayload = (await walletResponse.json()) as { wallet?: { points?: number } };
      setWalletPoints(Number(walletPayload.wallet?.points ?? 0));
    }

    if (payoutsResponse.ok) {
      const payoutPayload = (await payoutsResponse.json()) as {
        payouts?: PayoutRow[];
        settings?: SettingsPayload;
      };

      setPayoutRequests(payoutPayload.payouts ?? []);
      if (payoutPayload.settings) {
        setSettings(payoutPayload.settings);
      }
    }
  }, [user]);

  useEffect(() => {
    void loadPayoutData();
  }, [loadPayoutData]);

  const handleWithdraw = async (method: PaymentMethodKey) => {
    if (!user) {
      showToast("Please login first.", "error");
      return;
    }

    const accountNumber = method === "jazzcash" ? jazzCashInput.trim() : easyPaisaInput.trim();
    if (!accountNumber) {
      showToast("Please enter account number.", "error");
      return;
    }

    if (walletPoints < settings.minPayoutPoints) {
      showToast(`Minimum ${settings.minPayoutPoints} points required.`, "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/payouts", {
        method: "POST",
        maxRetries: 2,
        body: JSON.stringify({
          amountPoints: settings.minPayoutPoints,
          method,
          accountNumber,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Payout request failed");
      }

      showToast("Withdraw request submitted.", "success");
      if (method === "jazzcash") setJazzCashInput("");
      if (method === "easypaisa") setEasyPaisaInput("");
      await loadPayoutData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payout request failed";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const myRequests = useMemo(() => payoutRequests, [payoutRequests]);

  const pendingCount = useMemo(
    () => myRequests.filter((request) => request.status === "pending").length,
    [myRequests],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payout Zone</CardTitle>
          <CardDescription>Redeem your earned points with linked local payment methods.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Conversion</p>
            <p className="text-lg font-semibold">{conversionLabel}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Current points</p>
              <p className="text-2xl font-bold">{walletPoints}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Estimated payout</p>
              <p className="text-2xl font-bold text-success">{estimatedPkr} PKR</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/60 p-4 text-sm text-muted-foreground">
            Pending requests: {pendingCount}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button className="h-12 w-full" onClick={() => void handleWithdraw("jazzcash")} disabled={loading}>
              Withdraw via JazzCash
            </Button>
            <Button className="h-12 w-full" variant="secondary" onClick={() => void handleWithdraw("easypaisa")} disabled={loading}>
              Withdraw via EasyPaisa
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Requires at least {settings.minPayoutPoints} points and a payment account number.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Enter account details used for new payout requests.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/10 bg-background/60 p-4">
            <p className="font-medium">JazzCash</p>
            <Input
              id="jazzCash"
              label="Account Number"
              value={jazzCashInput}
              onChange={(event) => setJazzCashInput(event.target.value)}
              placeholder="03XXXXXXXXX"
            />
            <Badge variant={jazzCashInput.trim() ? "success" : "pending"}>
              {jazzCashInput.trim() ? "Ready for request" : "Enter account number"}
            </Badge>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-background/60 p-4">
            <p className="font-medium">EasyPaisa</p>
            <Input
              id="easyPaisa"
              label="Account Number"
              value={easyPaisaInput}
              onChange={(event) => setEasyPaisaInput(event.target.value)}
              placeholder="03XXXXXXXXX"
            />
            <Badge variant={easyPaisaInput.trim() ? "success" : "pending"}>
              {easyPaisaInput.trim() ? "Ready for request" : "Enter account number"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Requests remain pending until admin review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRequests.length ? (
            myRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-background/60 p-3 text-sm">
                <span>{new Date(request.created_at).toLocaleDateString()}</span>
                <span>{request.amount_pkr} PKR ({request.amount_points} pts)</span>
                <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "warning" : "pending"}>
                  {request.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
