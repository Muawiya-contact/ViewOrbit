"use client";

import { useEffect, useState } from "react";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
}

export default function AdminNotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/notifications");
      const data = await response.json();
      setRows(data.notifications ?? []);
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">System Notifications</h1>
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-300">{row.user_id} · {row.type}</p>
          <p className="text-sm text-white">{row.message}</p>
        </div>
      ))}
    </div>
  );
}
