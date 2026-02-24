"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Input } from "@/components/design-system/Input";
import { Card, CardContent } from "@/components/design-system/Card";
import { Progress } from "@/components/ui/progress";
import { DASHBOARD_NAV_ITEMS, ROUTES } from "@/lib/constants/routes";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useWalletStore } from "@/lib/store/useWalletStore";
import { useToastStore } from "@/lib/store/useToastStore";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
  const points = useWalletStore((state) => state.getPointsForUser(currentUser?.id));
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const showToast = useToastStore((state) => state.showToast);

  const title = DASHBOARD_NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Dashboard";
  const estimatedPkr = Math.floor((points / 1000) * 100);
  const avatarLabel = useMemo(() => {
    const name = currentUser?.fullName?.trim();
    if (!name) return "VO";
    const parts = name.split(" ").filter(Boolean);
    return `${parts[0]?.[0] ?? "V"}${parts[1]?.[0] ?? "O"}`.toUpperCase();
  }, [currentUser?.fullName]);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.fullName);
    setEmail(currentUser.email);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully.", "success");
    router.replace(ROUTES.LOGIN);
  };

  const handleProfileSave = () => {
    const result = updateProfile({ fullName, email });
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) {
      setProfileOpen(false);
    }
  };

  return (
    <header className="space-y-3 border-b border-white/10 bg-card/40 px-4 pb-4 pt-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {avatarLabel}
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-card p-4 shadow-xl backdrop-blur-xl">
              <p className="mb-3 text-sm font-semibold">View Profile</p>
              <div className="rounded-xl border border-white/10 bg-background/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{currentUser?.fullName ?? "Guest"}</p>
                <p>{currentUser?.email ?? "guest@vieworbit.local"}</p>
              </div>
              <div className="mt-4 space-y-3">
                <Input
                  id="topbar-fullName"
                  label="Edit Name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
                <Input
                  id="topbar-email"
                  label="Edit Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setProfileOpen(false)}>
                    Close
                  </Button>
                  <Button size="sm" onClick={handleProfileSave}>Save</Button>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Points</p>
              <p className="mt-1 text-2xl font-bold text-success">{points}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated PKR</p>
              <p className="mt-1 text-xl font-semibold">{estimatedPkr} PKR</p>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant="pending">1000 Points = 100 PKR</Badge>
          </div>
        </CardContent>
      </Card>
      <Progress value={Math.min(100, points % 100)} className="h-1" />
    </header>
  );
}
