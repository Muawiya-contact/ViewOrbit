"use client";

import { motion } from "framer-motion";
import { Instagram, Music2, Youtube } from "lucide-react";

const platforms = [
  {
    name: "YouTube",
    description: "Verified engagement tasks",
    icon: Youtube,
  },
  {
    name: "Instagram",
    description: "Verified engagement tasks",
    icon: Instagram,
  },
  {
    name: "TikTok",
    description: "Verified engagement tasks",
    icon: Music2,
  },
];

export function LandingPlatforms() {
  return (
    <section id="platforms" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-20 lg:py-28">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Supported Platforms</h2>
        <p className="text-slate-300">Choose verified tasks from the platforms you already use.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition-transform hover:-translate-y-1"
          >
            <platform.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-xl font-semibold text-white">{platform.name}</h3>
            <p className="mt-2 text-sm text-slate-300">{platform.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
