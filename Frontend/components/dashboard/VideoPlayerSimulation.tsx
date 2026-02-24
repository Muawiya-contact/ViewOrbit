"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Music2, Youtube } from "lucide-react";
import { Button } from "@/components/design-system/Button";
import { Badge } from "@/components/design-system/Badge";
import { Progress } from "@/components/ui/progress";
import { PLATFORM_LABELS } from "@/lib/constants/platforms";
import { type TaskItem, useTaskStore } from "../../lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Input } from "@/components/design-system/Input";

interface VideoPlayerSimulationProps {
  task: TaskItem;
}

const platformIcons = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music2,
};

export function VideoPlayerSimulation({ task }: VideoPlayerSimulationProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(task.progress);
  const [isRunning, setIsRunning] = useState(false);
  const [proofInput, setProofInput] = useState(task.proof ?? "");

  const startTask = useTaskStore((state) => state.startTask);
  const updateTaskProgress = useTaskStore((state) => state.updateTaskProgress);
  const submitTaskProof = useTaskStore((state) => state.submitTaskProof);
  const showToast = useToastStore((state) => state.showToast);
  const currentUser = useAuthStore((state) => state.currentUser);
  const PlatformIcon = platformIcons[task.platform];

  const progressValue = useMemo(() => {
    return Math.min(100, Math.round(elapsedSeconds));
  }, [elapsedSeconds]);

  const minimumPercent = 70;

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => {
        const next = Math.min(100, previous + 5);
        const result = updateTaskProgress(task.id, next);

        if (!result.success) {
          window.clearInterval(timer);
          window.clearInterval(timer);
          setIsRunning(false);
          showToast(result.message, "info");
          return previous;
        }

        if (next >= minimumPercent) {
          window.clearInterval(timer);
          setIsRunning(false);
          showToast("Condition reached. Submit your proof.", "success");
        }

        return next;
      });
    }, 350);

    return () => window.clearInterval(timer);
  }, [isRunning, minimumPercent, showToast, task.id, updateTaskProgress]);

  useEffect(() => {
    setElapsedSeconds(task.progress);
    setProofInput(task.proof ?? "");
  }, [task.progress, task.proof]);

  const handleStartTask = () => {
    if (!currentUser) {
      showToast("Please login first.", "error");
      return;
    }

    const result = startTask(task.id, currentUser.id);
    if (!result.success) {
      showToast(result.message, "info");
      return;
    }

    setElapsedSeconds(0);
    setIsRunning(true);
    showToast("Task started.", "info");
  };

  const handleContinueProgress = () => {
    if (task.status !== "in-progress") return;
    setIsRunning(true);
  };

  const handleSubmitProof = () => {
    const result = submitTaskProof(task.id, proofInput);
    showToast(result.message, result.success ? "success" : "error");
  };

  const statusVariant =
    task.status === "approved"
      ? "success"
      : task.status === "pending"
        ? "pending"
        : task.status === "rejected"
          ? "warning"
          : task.status === "in-progress"
            ? "pending"
            : "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-card/75 p-4 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PlatformIcon size={14} className="text-muted-foreground" />
            <Badge variant="pending">{PLATFORM_LABELS[task.platform]}</Badge>
          </div>
          <h4 className="font-medium text-foreground">{task.title}</h4>
          <p className="text-xs text-muted-foreground">{task.condition}</p>
        </div>
        <Badge variant={statusVariant}>
          {task.status}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Reward</span>
          <span className="font-semibold text-success">+{task.reward} Points</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Engagement progress</span>
          <span>{progressValue}%</span>
        </div>
        <Progress value={progressValue} />
        <p className="text-xs text-muted-foreground">Minimum required: {minimumPercent}%</p>
      </div>

      {task.status === "available" ? (
        <div className="mt-4">
          <Button onClick={handleStartTask} className="h-11 w-full">Start Task</Button>
        </div>
      ) : null}

      {task.status === "in-progress" ? (
        <div className="mt-4 space-y-3">
          <Button onClick={handleContinueProgress} className="h-11 w-full" disabled={isRunning || progressValue >= minimumPercent}>
            {isRunning ? "Tracking..." : progressValue >= minimumPercent ? "70% Reached" : "Continue Task"}
          </Button>
          {progressValue >= minimumPercent ? (
            <>
              <Input
                id={`proof-${task.id}`}
                value={proofInput}
                onChange={(event) => setProofInput(event.target.value)}
                placeholder="Paste proof link or note"
              />
              <Button onClick={handleSubmitProof} className="h-11 w-full">Submit Proof</Button>
            </>
          ) : null}
        </div>
      ) : null}

      {task.status === "pending" ? (
        <p className="mt-4 text-sm text-muted-foreground">Proof submitted. Waiting for admin review.</p>
      ) : null}

      {task.status === "approved" ? (
        <p className="mt-4 text-sm text-success">Approved. Reward credited to your wallet.</p>
      ) : null}

      {task.status === "rejected" ? (
        <p className="mt-4 text-sm text-warning">Rejected by admin. Please retry with valid proof.</p>
      ) : null}
    </motion.div>
  );
}