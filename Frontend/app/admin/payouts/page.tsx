"use client";

import { useEffect, useState } from "react";

interface PayoutRow {
  id: string;
  user_id: string;
  amount_points: number;
  amount_pkr: number;
  status: string;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);

  const loadPayouts = async () => {
    const response = await fetch("/api/admin/payouts");
    const data = await response.json();
    setPayouts(data.payouts ?? []);
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const review = async (payoutId: string, action: "approve" | "reject") => {
    await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, action }),
    });
    await loadPayouts();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Payout Requests</h1>
      {payouts.map((payout) => (
        <div key={payout.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">User: {payout.user_id}</p>
          <p className="text-sm text-white">{payout.amount_points} pts ({payout.amount_pkr} PKR)</p>
          <p className="mb-3 text-xs text-slate-300">Status: {payout.status}</p>
          <div className="flex gap-2">
            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white" onClick={() => review(payout.id, "approve")}>Approve</button>
            <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white" onClick={() => review(payout.id, "reject")}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
