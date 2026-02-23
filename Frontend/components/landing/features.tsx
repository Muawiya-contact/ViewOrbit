"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Reward-based Viewer Experience",
    description: "Increase watch consistency with point systems and transparent activity tracking.",
  },
  {
    title: "Channel Performance Insights",
    description: "Give channel owners clear status and actionable analytics placeholders for scaling.",
  },
  {
    title: "Centralized Admin Operations",
    description: "Handle user management, channel approvals, and payouts from one operational dashboard.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Features</h2>
        <p className="mt-2 text-slate-600">Built for scalable growth across all platform roles.</p>
      </motion.div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
