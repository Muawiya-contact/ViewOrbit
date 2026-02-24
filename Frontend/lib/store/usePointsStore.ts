"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PointsState {
  animatedPoints: number;
  syncToPoints: (targetPoints: number) => void;
}

export const usePointsStore = create<PointsState>()(
  persist(
    (set) => ({
      animatedPoints: 0,
      syncToPoints: (targetPoints) => {
        const normalizedTarget = Math.max(0, targetPoints);

        set((state) => {
          if (state.animatedPoints === normalizedTarget) {
            return state;
          }

          const delta = normalizedTarget - state.animatedPoints;
          const step = Math.max(1, Math.ceil(Math.abs(delta) / 8));
          const nextValue =
            delta > 0
              ? Math.min(normalizedTarget, state.animatedPoints + step)
              : Math.max(normalizedTarget, state.animatedPoints - step);

          return { animatedPoints: nextValue };
        });
      },
    }),
    {
      name: "vieworbit-points-store",
    },
  ),
);
