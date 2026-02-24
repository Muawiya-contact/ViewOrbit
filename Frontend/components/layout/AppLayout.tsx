import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return <div className={cn("min-h-screen bg-background text-foreground", className)}>{children}</div>;
}
