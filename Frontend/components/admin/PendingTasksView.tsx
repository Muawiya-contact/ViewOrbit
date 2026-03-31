"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

export default function PendingTasksView() {
  const { tasks, approveTask, rejectTask, fetchPendingTasks } = useAdminStore();
  const [isLoading, setIsLoading] = useState(false);
  const [actioningTaskId, setActioningTaskId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchPendingTasks().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (taskId: string) => {
    setActioningTaskId(taskId);
    const result = await approveTask(taskId);
    if (!result.success) {
      alert(result.error || "Failed to approve task");
    }
    setActioningTaskId(null);
  };

  const handleReject = async (taskId: string) => {
    setActioningTaskId(taskId);
    const result = await rejectTask(taskId);
    if (!result.success) {
      alert(result.error || "Failed to reject task");
    }
    setActioningTaskId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">No pending tasks for review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Task Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-200 text-xs font-semibold">
                  {task.platform}
                </div>
                <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-200 text-xs font-semibold">
                  {task.progress}% Complete
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                    User
                  </p>
                  <p className="text-white font-medium">{task.userName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                    Reward
                  </p>
                  <p className="text-white font-medium">{task.rewardPoints} Points</p>
                </div>
              </div>

              {task.proofUrl && (
                <div className="mt-4">
                  <a
                    href={task.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Proof
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(task.id)}
                disabled={actioningTaskId === task.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-200 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition"
              >
                {actioningTaskId === task.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>

              <button
                onClick={() => handleReject(task.id)}
                disabled={actioningTaskId === task.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition"
              >
                {actioningTaskId === task.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
