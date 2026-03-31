import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getProfileForUser, requireAuthenticatedUser } from "@/lib/server/foundation-data";

export default async function ProfilePage() {
  const { user } = await requireAuthenticatedUser();
  const profile = await getProfileForUser(user.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="mt-1 text-base font-medium">{profile?.email ?? user.email ?? "N/A"}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Account created</p>
        <p className="mt-1 text-base font-medium">
          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}
