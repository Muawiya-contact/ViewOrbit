"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { PLATFORM_LABELS } from "@/lib/constants/platforms";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTaskStore, type TaskLifecycleStatus } from "../../lib/store/useTaskStore";

const statusTabs: Array<"available" | "in-progress" | "pending" | "approved" | "rejected"> = [
  "available",
  "in-progress",
  "pending",
  "approved",
  "rejected",
];

const statusVariantMap: Record<TaskLifecycleStatus, "success" | "warning" | "pending" | "danger"> = {
  available: "pending",
  "in-progress": "pending",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function TaskHistory() {
  const [activeTab, setActiveTab] = useState<TaskLifecycleStatus>("available");
  const currentUser = useAuthStore((state) => state.currentUser);
  const tasks = useTaskStore((state) => state.tasks);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab !== task.status) return false;
      if (!currentUser) return true;
      return task.userId === currentUser.id || task.userId === "global";
    });
  }, [activeTab, currentUser, tasks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
          <CardDescription>Track tasks by lifecycle status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {statusTabs.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={activeTab === status ? "primary" : "secondary"}
                onClick={() => setActiveTab(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="space-y-2 px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{task.title}</p>
                  <Badge variant={statusVariantMap[task.status]}>{task.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Platform: {PLATFORM_LABELS[task.platform]}</p>
                <p className="text-xs text-muted-foreground">Condition: {task.condition}</p>
                <p className="text-xs text-muted-foreground">Reward: {task.reward} points</p>
                {task.proof ? <p className="text-xs text-muted-foreground">Proof: {task.proof}</p> : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="px-4 py-4 text-sm text-muted-foreground">
              No tasks in this status.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
