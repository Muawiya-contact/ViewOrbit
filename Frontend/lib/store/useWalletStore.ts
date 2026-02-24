"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { debugLog } from "@/lib/config/env";

export type PaymentMethodKey = "jazzcash" | "easypaisa";
export type WithdrawStatus = "pending" | "approved" | "rejected";

export interface LinkedPaymentMethod {
  accountNumber: string;
  linkedAt: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  points: number;
  amountPkr: number;
  method: PaymentMethodKey;
  status: WithdrawStatus;
  requestedAt: string;
}

export interface RewardLog {
  id: string;
  taskId: string;
  userId: string;
  points: number;
  note: string;
  createdAt: string;
}

interface WalletState {
  pointsByUser: Record<string, number>;
  linkedMethods: Partial<Record<PaymentMethodKey, LinkedPaymentMethod>>;
  withdrawRequests: WithdrawRequest[];
  rewardLogs: RewardLog[];
  getPointsForUser: (userId?: string | null) => number;
  linkPaymentMethod: (method: PaymentMethodKey, accountNumber: string) => { success: boolean; message: string };
  unlinkPaymentMethod: (method: PaymentMethodKey) => void;
  addRewardPoints: (payload: { taskId: string; userId: string; points: number; note: string }) => void;
  createWithdrawRequest: (payload: { userId: string; method: PaymentMethodKey }) => { success: boolean; message: string };
  setWithdrawStatus: (requestId: string, status: WithdrawStatus) => void;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toPkr = (points: number) => Math.floor((points / 1000) * 100);

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      pointsByUser: {},
      linkedMethods: {},
      withdrawRequests: [],
      rewardLogs: [],
      getPointsForUser: (userId) => {
        if (!userId) return 0;
        return get().pointsByUser[userId] ?? 0;
      },
      linkPaymentMethod: (method, accountNumber) => {
        const normalized = accountNumber.trim();

        if (normalized.length < 8) {
          return { success: false, message: "Enter a valid account number." };
        }

        set((state) => ({
          linkedMethods: {
            ...state.linkedMethods,
            [method]: {
              accountNumber: normalized,
              linkedAt: new Date().toISOString().split("T")[0],
            },
          },
        }));

        debugLog("wallet-method-linked", { method });
        return { success: true, message: `${method} linked.` };
      },
      unlinkPaymentMethod: (method) => {
        set((state) => {
          const next = { ...state.linkedMethods };
          delete next[method];
          return { linkedMethods: next };
        });

        debugLog("wallet-method-unlinked", { method });
      },
      addRewardPoints: ({ taskId, userId, points, note }) => {
        const reward: RewardLog = {
          id: createId(),
          taskId,
          userId,
          points,
          note,
          createdAt: new Date().toISOString().split("T")[0],
        };

        set((state) => ({
          pointsByUser: {
            ...state.pointsByUser,
            [userId]: (state.pointsByUser[userId] ?? 0) + points,
          },
          rewardLogs: [reward, ...state.rewardLogs],
        }));

        debugLog("wallet-reward-added", { taskId, points });
      },
      createWithdrawRequest: ({ userId, method }) => {
        const state = get();
        const currentPoints = state.pointsByUser[userId] ?? 0;

        if (currentPoints < 1000) {
          return { success: false, message: "Minimum 1000 points required." };
        }

        if (!state.linkedMethods[method]) {
          return { success: false, message: "Link this payment method first." };
        }

        const request: WithdrawRequest = {
          id: createId(),
          userId,
          points: 1000,
          amountPkr: toPkr(1000),
          method,
          status: "pending",
          requestedAt: new Date().toISOString().split("T")[0],
        };

        set((state) => ({
          pointsByUser: {
            ...state.pointsByUser,
            [userId]: (state.pointsByUser[userId] ?? 0) - 1000,
          },
          withdrawRequests: [request, ...state.withdrawRequests],
        }));

        debugLog("wallet-withdraw-request", { method, requestId: request.id });
        return { success: true, message: "Withdraw request submitted." };
      },
      setWithdrawStatus: (requestId, status) => {
        set((state) => ({
          withdrawRequests: state.withdrawRequests.map((request) =>
            request.id === requestId ? { ...request, status } : request,
          ),
        }));

        debugLog("wallet-withdraw-status", { requestId, status });
      },
    }),
    {
      name: "vieworbit-wallet-store",
    },
  ),
);
