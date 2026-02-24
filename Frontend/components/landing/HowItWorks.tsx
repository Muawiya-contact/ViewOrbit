"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CheckCircle, MousePointerClick } from "lucide-react";

const steps = [
  {
    title: "Choose a Task",
    description: "Select from YouTube, Instagram, or TikTok tasks.",
    icon: MousePointerClick,
  },
  {
    title: "Complete 70% Requirement",
    description: "Watch or engage at least 70%. Submit proof.",
    icon: CheckCircle,
  },
  {
    title: "Admin Approval & Earn Points",
    description: "After approval, points are added to your wallet.",
    icon: BadgeCheck,
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-20 lg:py-28">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">How It Works</h2>
        <p className="text-slate-300">A simple, verified reward flow built for trust.</p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <step.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
