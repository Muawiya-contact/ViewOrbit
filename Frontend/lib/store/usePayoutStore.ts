"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentMethodKey = "jazzcash" | "easypaisa";

interface LinkedMethod {
  accountNumber: string;
  linkedAt: string;
}

interface PayoutState {
  methods: Partial<Record<PaymentMethodKey, LinkedMethod>>;
  linkMethod: (method: PaymentMethodKey, accountNumber: string) => { success: boolean; message: string };
  unlinkMethod: (method: PaymentMethodKey) => void;
}

export const usePayoutStore = create<PayoutState>()(
  persist(
    (set) => ({
      methods: {},
      linkMethod: (method, accountNumber) => {
        const normalized = accountNumber.trim();

        if (normalized.length < 8) {
          return { success: false, message: "Enter a valid account number." };
        }

        set((state) => ({
          methods: {
            ...state.methods,
            [method]: {
              accountNumber: normalized,
              linkedAt: new Date().toISOString().split("T")[0],
            },
          },
        }));

        return { success: true, message: `${method} linked successfully.` };
      },
      unlinkMethod: (method) => {
        set((state) => {
          const nextMethods = { ...state.methods };
          delete nextMethods[method];
          return { methods: nextMethods };
        });
      },
    }),
    {
      name: "vieworbit-payout-store",
    },
  ),
);
