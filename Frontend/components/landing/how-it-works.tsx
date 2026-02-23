"use client";

import { motion } from "framer-motion";

const steps = [
  { title: "Sign Up", description: "Create your account as viewer, channel owner, or admin." },
  { title: "Engage", description: "Watch curated content and interact with platform workflows." },
  { title: "Track Outcomes", description: "Monitor points, approvals, and operations in real time." },
];

export function HowItWorksSection() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">How It Works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
