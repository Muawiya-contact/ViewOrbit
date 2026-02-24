"use client";

import { ArrowRight, CreditCard } from "lucide-react";

export function LandingRewards() {
  return (
    <section id="rewards" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-20 lg:py-28">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Transparent Reward System</h2>
        <p className="text-slate-300">Withdraw earnings directly to your linked wallet after approval.</p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Conversion</p>
          <div className="mt-4 flex items-center gap-3 text-2xl font-semibold text-white">
            <span>1000 Points</span>
            <ArrowRight className="h-6 w-6 text-primary" />
            <span>100 PKR</span>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">Wallet Balance</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">2,450</p>
            <p className="text-xs text-slate-400">Estimated PKR: 245</p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-white">
            <CreditCard className="h-6 w-6 text-primary" />
            <p className="text-lg font-semibold">Payout Wallets</p>
          </div>
          <p className="mt-3 text-sm text-slate-300">Link your JazzCash or EasyPaisa account for instant payouts.</p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">JazzCash</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">EasyPaisa</div>
          </div>
        </div>
      </div>
    </section>
  );
}
