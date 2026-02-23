"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
          Intelligent Video Engagement Platform
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Accelerate channel growth with measurable audience engagement.
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
          ViewOrbit helps viewers earn rewards, channel owners grow sustainably, and admins operate with full platform visibility.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Get Started
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Login
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Platform Snapshot</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Active Viewers", "24.8K"],
              ["Channels Managed", "1,240"],
              ["Weekly Watch Sessions", "87K"],
              ["Avg. Retention Lift", "+22%"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
