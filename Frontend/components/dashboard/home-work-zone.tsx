"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/design-system/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { VideoPlayerSimulation } from "@/components/dashboard/VideoPlayerSimulation";
import { Button } from "@/components/design-system/Button";
import { PLATFORM_LABELS } from "@/lib/constants/platforms";
import { useTaskStore } from "../../lib/store/useTaskStore";
import { usePointsStore } from "@/lib/store/usePointsStore";
import { useWalletStore } from "@/lib/store/useWalletStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

const tabs = ["instagram", "tiktok", "youtube"] as const;

export function HomeWorkZone() {
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof tabs)[number] | "all">("all");
  const currentUser = useAuthStore((state) => state.currentUser);
  const points = useWalletStore((state) => state.getPointsForUser(currentUser?.id));
  const tasks = useTaskStore((state) => state.tasks);
  const animatedPoints = usePointsStore((state) => state.animatedPoints);
  const syncToPoints = usePointsStore((state) => state.syncToPoints);

  useEffect(() => {
    syncToPoints(points);
  }, [points, syncToPoints]);

  const userTasks = tasks.filter((task) =>
    tabs.includes(task.platform) && (!currentUser || task.userId === "global" || task.userId === currentUser.id),
  );
  const completedTasks = tasks.filter((task) => task.status === "approved").length;
  const platformGroups = tabs.map((platform) => ({
    platform,
    tasks: userTasks.filter((task) => task.platform === platform),
  }));

  const visibleGroups = selectedPlatform === "all"
    ? platformGroups
    : platformGroups.filter((group) => group.platform === selectedPlatform);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Wall</CardTitle>
          <CardDescription>Complete social tasks and earn rewards in a clean, gamified flow.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <motion.p key={animatedPoints} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-3xl font-bold">
            {animatedPoints}
          </motion.p>
          <Badge variant={completedTasks > 0 ? "success" : "pending"}>{completedTasks} tasks completed</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Zone</CardTitle>
          <CardDescription>Start tasks, reach 70%, submit proof, then wait for admin approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button
              variant={selectedPlatform === "all" ? "primary" : "secondary"}
              className="h-12"
              onClick={() => setSelectedPlatform("all")}
            >
              All
            </Button>
            {tabs.map((platform) => (
              <Button
                key={platform}
                variant={selectedPlatform === platform ? "primary" : "secondary"}
                className="h-12"
                onClick={() => setSelectedPlatform(platform)}
              >
                {PLATFORM_LABELS[platform]}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {visibleGroups.map((group) => (
              <div key={group.platform} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{PLATFORM_LABELS[group.platform]}</h3>
                  <Badge variant="pending">{group.tasks.length} tasks</Badge>
                </div>
                <div className="space-y-3">
                  {group.tasks.length ? (
                    group.tasks.map((task) => <VideoPlayerSimulation key={task.id} task={task} />)
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                      No tasks available.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-5 py-4">
          <p className="text-sm font-semibold">Want to promote your channel?</p>
          <p className="mt-1 text-sm text-muted-foreground">Contact us to list your campaign and get real engagement.</p>
        </CardContent>
      </Card>
    </div>
  );
}
