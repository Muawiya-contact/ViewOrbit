"use client";

import { useState } from "react";
import type { NotificationData } from "@/lib/types/foundation";

interface NotificationsListProps {
  initialNotifications: NotificationData[];
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const markAsRead = async (notificationId: string) => {
    setUpdatingId(notificationId);
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId }),
    });

    if (response.ok) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
    }

    setUpdatingId(null);
  };

  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-1 flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{notification.type}</p>
            <span className="text-xs text-muted-foreground">
              {new Date(notification.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{notification.message}</p>
          <button
            type="button"
            onClick={() => markAsRead(notification.id)}
            disabled={notification.isRead || updatingId === notification.id}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {notification.isRead ? "Read" : updatingId === notification.id ? "Updating..." : "Mark as read"}
          </button>
        </div>
      ))}
    </div>
  );
}
