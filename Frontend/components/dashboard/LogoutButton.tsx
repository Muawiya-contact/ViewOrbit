"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearFirebaseAuthCookie } from "@/lib/auth/firebase-session";
import { ROUTES } from "@/lib/constants/routes";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    clearFirebaseAuthCookie();
    router.replace(ROUTES.LOGIN);
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      Logout
    </button>
  );
}
