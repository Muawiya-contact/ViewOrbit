"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/design-system/Button";
import { ROUTES } from "@/lib/constants/routes";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A192F] via-[#0B1F3A] to-[#0A192F]">
      <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-blue-500/30 blur-[120px]" />
      <div className="absolute right-10 top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-[120px]" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:px-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200">
            Trusted Reward Network
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Earn Rewards by Completing Social Media Tasks
          </h1>
          <p className="max-w-xl text-base text-slate-300 md:text-lg">
            Complete verified tasks from YouTube, Instagram, and TikTok. Submit proof. Get approved. Redeem real cash.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ROUTES.REGISTER}>
              <Button className="h-12 px-6 text-base">Start Earning</Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button variant="secondary" className="h-12 px-6 text-base border border-white/20 bg-white/5 text-white hover:bg-white/10">
                Become a Creator
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Task → Approval → Points → Cash</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Active Tasks", "240"],
                ["Approved Proofs", "18.4K"],
                ["Total Points", "1.2M"],
                ["Creators Onboarded", "3,260"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
