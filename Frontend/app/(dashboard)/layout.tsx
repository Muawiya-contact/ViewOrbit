import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { verifyCookieUser } from "@/lib/server/firebase-admin";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await verifyCookieUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <DashboardTopNav email={user.email ?? "User"} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
