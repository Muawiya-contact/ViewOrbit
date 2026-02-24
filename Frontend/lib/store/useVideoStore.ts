"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SimulatedVideo {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface VideoState {
  videos: SimulatedVideo[];
  markCompleted: (id: string) => void;
  resetVideos: () => void;
}

const initialVideos: SimulatedVideo[] = [
  { id: "video-1", title: "SaaS Audience Growth Blueprint", duration: 10, completed: false },
  { id: "video-2", title: "Retention Tactics for New Channels", duration: 10, completed: false },
  { id: "video-3", title: "Viewer Engagement Fundamentals", duration: 10, completed: false },
];

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      videos: initialVideos,
      markCompleted: (id) =>
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === id ? { ...video, completed: true } : video,
          ),
        })),
      resetVideos: () => set({ videos: initialVideos }),
    }),
    {
      name: "vieworbit-video-store",
    },
  ),
);
