import { getWalletForUser, requireAuthenticatedUser } from "@/lib/server/foundation-data";

export default async function WalletPage() {
  const { user } = await requireAuthenticatedUser();
  const wallet = await getWalletForUser(user.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Wallet</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Current balance</p>
          <p className="mt-1 text-2xl font-semibold">{wallet?.points ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lifetime earned</p>
          <p className="mt-1 text-2xl font-semibold">{wallet?.lifetimeEarned ?? 0}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Transactions</p>
        <p className="mt-1 text-sm text-muted-foreground">Transaction history placeholder (Phase 1).</p>
      </div>
    </div>
  );
}
