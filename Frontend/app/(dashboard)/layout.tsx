import { DashboardLayout as DashboardShell } from "@/components/layout/DashboardLayout";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
