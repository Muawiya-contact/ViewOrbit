"use client";

import { motion } from "framer-motion";
import { Instagram, Music2, Youtube } from "lucide-react";
import { Button } from "@/components/design-system/Button";

const taskCards = [
  {
    platform: "YouTube",
    description: "Watch 70% of Video",
    reward: "+10 Points",
    icon: Youtube,
  },
  {
    platform: "Instagram",
    description: "Watch 70% of Reel",
    reward: "+10 Points",
    icon: Instagram,
  },
  {
    platform: "TikTok",
    description: "Watch 70% of Clip",
    reward: "+10 Points",
    icon: Music2,
  },
];

export function LandingTaskWall() {
  return (
    <section id="task-wall" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-20 lg:py-28">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">The Task Wall</h2>
        <p className="text-slate-300">Browse categorized tasks and start earning instantly.</p>
      </div>
      <div className="mt-10 space-y-4">
        {taskCards.map((card, index) => (
          <motion.div
            key={card.platform}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <card.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{card.platform}</p>
                <p className="text-sm text-slate-300">{card.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-emerald-300">{card.reward}</span>
              <Button className="h-11">Start Task</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
