"use client";

import { useEffect, useState } from "react";

interface AdminRule {
  id: string;
  task_type: string;
  min_watch_percent: number;
  reward_points: number;
  daily_cap: number;
}

export default function AdminRulesPage() {
  const [rules, setRules] = useState<AdminRule[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/rules");
      const data = await response.json();
      setRules(data.rules ?? []);
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Rules</h1>
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="font-medium text-white">{rule.task_type}</p>
          <p>Min watch: {rule.min_watch_percent}%</p>
          <p>Reward: {rule.reward_points} points</p>
          <p>Daily cap: {rule.daily_cap}</p>
        </div>
      ))}
    </div>
  );
}
