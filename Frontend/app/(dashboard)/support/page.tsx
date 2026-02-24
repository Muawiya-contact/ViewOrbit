"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { ServiceInquiryZone } from "@/components/dashboard/service-inquiry-zone";
import { ROLES } from "@/lib/constants/roles";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function SupportPage() {
  const role = useAuthStore((state) => state.role);

  if (role === ROLES.ADMIN) {
    return <AdminDashboard />;
  }

  return <ServiceInquiryZone />;
}
