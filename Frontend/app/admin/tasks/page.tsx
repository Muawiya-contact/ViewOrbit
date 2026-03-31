"use client";

import { useEffect, useState } from "react";

interface AdminTask {
  id: string;
  title: string;
  platform: string;
  reward_points: number;
  is_active: boolean;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [rewardPoints, setRewardPoints] = useState(10);

  const loadTasks = async () => {
    const response = await fetch("/api/admin/tasks");
    const data = await response.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleTask = async (task: AdminTask) => {
    await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, isActive: !task.is_active }),
    });
    await loadTasks();
  };

  const createTask = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    await fetch("/api/admin/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: normalizedTitle,
        platform: "youtube",
        rewardPoints,
        isActive: true,
      }),
    });

    setTitle("");
    await loadTasks();
  };

  if (loading) return <p className="text-sm text-slate-300">Loading tasks...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Tasks</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm text-slate-300">Create Task</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <input
            type="number"
            value={rewardPoints}
            min={0}
            onChange={(event) => setRewardPoints(Number(event.target.value || 0))}
            placeholder="Reward points"
            className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => void createTask()}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            Create
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{task.title}</p>
                <p className="text-sm text-slate-300">
                  {task.platform} · {task.reward_points} pts · {task.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleTask(task)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white"
              >
                Toggle Active
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
