import { NotificationsList } from "@/components/dashboard/NotificationsList";
import { getNotificationsForUser, requireAuthenticatedUser } from "@/lib/server/foundation-data";

export default async function NotificationsPage() {
  const { user } = await requireAuthenticatedUser();
  const notifications = await getNotificationsForUser(user.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Notifications</h2>
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
