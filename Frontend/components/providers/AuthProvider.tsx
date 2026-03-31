"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const syncSession = useAuthStore((state) => state.syncSession);
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);

  useEffect(() => {
    syncSession();
    const cleanup = initializeAuthListener();
    return cleanup;
  }, [initializeAuthListener, syncSession]);

  return <>{children}</>;
}
