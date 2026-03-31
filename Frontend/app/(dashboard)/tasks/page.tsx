import { getActiveTasks, requireAuthenticatedUser } from "@/lib/server/foundation-data";

export default async function TasksPage() {
  await requireAuthenticatedUser();
  const tasks = await getActiveTasks();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Active Tasks</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-base font-medium">{task.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Platform: {task.platform} · Reward: {task.rewardPoints} pts
              </p>
              <button
                type="button"
                disabled
                className="rounded-md border border-border px-3 py-1.5 text-xs opacity-60"
              >
                Complete
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active tasks available right now.</p>
        ) : null}
      </div>
    </div>
  );
}
