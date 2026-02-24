"use client";

import { useState } from "react";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useWalletStore, type PaymentMethodKey } from "@/lib/store/useWalletStore";
import { useToastStore } from "@/lib/store/useToastStore";

const conversionLabel = "1000 Points = 100 PKR";

export function RedeemPayoutZone() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const points = useWalletStore((state) => state.getPointsForUser(currentUser?.id));
  const linkedMethods = useWalletStore((state) => state.linkedMethods);
  const withdrawRequests = useWalletStore((state) => state.withdrawRequests);
  const linkPaymentMethod = useWalletStore((state) => state.linkPaymentMethod);
  const unlinkPaymentMethod = useWalletStore((state) => state.unlinkPaymentMethod);
  const createWithdrawRequest = useWalletStore((state) => state.createWithdrawRequest);
  const showToast = useToastStore((state) => state.showToast);

  const [jazzCashInput, setJazzCashInput] = useState("");
  const [easyPaisaInput, setEasyPaisaInput] = useState("");

  const estimatedPkr = Math.floor((points / 1000) * 100);

  const handleLink = (method: PaymentMethodKey, value: string) => {
    const result = linkPaymentMethod(method, value);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) {
      if (method === "jazzcash") setJazzCashInput("");
      if (method === "easypaisa") setEasyPaisaInput("");
    }
  };

  const handleUnlink = (method: PaymentMethodKey) => {
    unlinkPaymentMethod(method);
    showToast(`${method} unlinked.`, "info");
  };

  const handleWithdraw = (method: PaymentMethodKey) => {
    if (!currentUser) {
      showToast("Please login first.", "error");
      return;
    }

    const result = createWithdrawRequest({ userId: currentUser.id, method });
    showToast(result.message, result.success ? "success" : "error");
  };

  const myRequests = currentUser
    ? withdrawRequests.filter((request) => request.userId === currentUser.id)
    : [];

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
              <p className="text-2xl font-bold">{points}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Estimated payout</p>
              <p className="text-2xl font-bold text-success">{estimatedPkr} PKR</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button className="h-12 w-full" onClick={() => handleWithdraw("jazzcash")}>Withdraw via JazzCash</Button>
            <Button className="h-12 w-full" variant="secondary" onClick={() => handleWithdraw("easypaisa")}>Withdraw via EasyPaisa</Button>
          </div>
          <p className="text-xs text-muted-foreground">Requires at least 1000 points and a linked payment method.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Payment Methods</CardTitle>
          <CardDescription>Link or unlink JazzCash and EasyPaisa anytime.</CardDescription>
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
            <div className="flex gap-2">
              <Button className="h-11" variant="primary" onClick={() => handleLink("jazzcash", jazzCashInput)}>Link</Button>
              <Button className="h-11" variant="secondary" onClick={() => handleUnlink("jazzcash")}>Unlink</Button>
            </div>
            {linkedMethods.jazzcash ? <Badge variant="success">Linked: {linkedMethods.jazzcash.accountNumber}</Badge> : <Badge variant="pending">Not linked</Badge>}
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
            <div className="flex gap-2">
              <Button className="h-11" variant="primary" onClick={() => handleLink("easypaisa", easyPaisaInput)}>Link</Button>
              <Button className="h-11" variant="secondary" onClick={() => handleUnlink("easypaisa")}>Unlink</Button>
            </div>
            {linkedMethods.easypaisa ? <Badge variant="success">Linked: {linkedMethods.easypaisa.accountNumber}</Badge> : <Badge variant="pending">Not linked</Badge>}
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
                <span>{request.requestedAt}</span>
                <span>{request.amountPkr} PKR</span>
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
