import type { Timestamp } from "firebase-admin/firestore";

export type WalletType = "JazzCash" | "EasyPaisa";
export type UserRole = "user" | "admin";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  walletType: WalletType;
  walletNumber: string;
  points: number;
  streak: number;
  status: "active";
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
