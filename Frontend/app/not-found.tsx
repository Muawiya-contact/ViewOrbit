"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/design-system/Button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold text-foreground">Page not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are trying to access does not exist.
      </p>
      <Button onClick={() => router.push("/")}>Go Home</Button>
    </div>
  );
}
