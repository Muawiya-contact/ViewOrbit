"use client";

import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLATFORM_LABELS } from "@/lib/constants/platforms";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { useTaskStore } from "../../lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useWalletStore } from "@/lib/store/useWalletStore";

const demoUsers = [
  { id: "u1", name: "Amina Yusuf", email: "amina@vieworbit.com", role: "viewer", status: "active" },
  { id: "u2", name: "Daniel Briggs", email: "daniel@vieworbit.com", role: "channel-owner", status: "active" },
  { id: "u3", name: "Sara Kim", email: "sara@vieworbit.com", role: "admin", status: "active" },
];

const toStatusVariant = (status: string) => {
  if (status === "approved" || status === "active" || status === "completed") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "pending" as const;
};

export function AdminDashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const taskFilter = useAdminStore((state) => state.taskFilter);
  const setTaskFilter = useAdminStore((state) => state.setTaskFilter);
  const approveTask = useAdminStore((state) => state.approveTask);
  const rejectTask = useAdminStore((state) => state.rejectTask);
  const approvePayout = useAdminStore((state) => state.approvePayout);
  const rejectPayout = useAdminStore((state) => state.rejectPayout);
  const rewardLogs = useWalletStore((state) => state.rewardLogs);
  const withdrawRequests = useWalletStore((state) => state.withdrawRequests);
  const registeredUsers = useAuthStore((state) => state.users);
  const showToast = useToastStore((state) => state.showToast);

  const allUsers = [
    ...demoUsers,
    ...registeredUsers.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      status: "active",
    })),
  ];

  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const filteredTasks = taskFilter === "all"
    ? tasks
    : tasks.filter((task) => task.status === taskFilter);

  const rewardDistribution = rewardLogs.reduce<Record<string, number>>((acc, activity) => {
    const task = tasks.find((item) => item.id === activity.taskId);
    const key = task ? PLATFORM_LABELS[task.platform] : "Other";
    acc[key] = (acc[key] ?? 0) + activity.points;
    return acc;
  }, {});

  const totalRewards = rewardLogs.reduce((sum, log) => sum + log.points, 0);

  const handleApprove = (taskId: string) => {
    const result = approveTask(taskId);
    showToast(result.message, result.success ? "success" : "error");
  };

  const handleReject = (taskId: string) => {
    const result = rejectTask(taskId);
    showToast(result.message, result.success ? "success" : "error");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{allUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rewards Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalRewards} pts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="transition-colors hover:border-border/80">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Monitor all registered users by role and account status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={toStatusVariant(user.status)}>{user.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-border/80">
        <CardHeader>
          <CardTitle>Task Approval Queue</CardTitle>
          <CardDescription>Filter, review proof, and approve or reject tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "available", "in-progress", "pending", "approved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={taskFilter === status ? "primary" : "secondary"}
                onClick={() => setTaskFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{PLATFORM_LABELS[task.platform]}</TableCell>
                  <TableCell>{task.userId}</TableCell>
                  <TableCell>{task.reward} pts</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{task.proof ?? "--"}</TableCell>
                  <TableCell>
                    <Badge variant={toStatusVariant(task.status)}>{task.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {task.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(task.id)}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReject(task.id)}>Reject</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No action needed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-border/80">
        <CardHeader>
          <CardTitle>Reward & Payout Logs</CardTitle>
          <CardDescription>Track rewards and approve withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium">Reward Distribution by Platform</p>
              {Object.keys(rewardDistribution).length ? (
                Object.entries(rewardDistribution).map(([platform, distributedPoints]) => (
                  <div key={platform} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-sm">
                    <span>{platform}</span>
                    <Badge variant="success">{distributedPoints} pts</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reward distribution yet.</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Payout Requests</p>
              {withdrawRequests.length ? (
                withdrawRequests.map((request) => (
                  <div key={request.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{request.userId}</span>
                      <Badge variant={toStatusVariant(request.status)}>{request.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{request.method}</span>
                      <span>{request.amountPkr} PKR</span>
                    </div>
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approvePayout(request.id)}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => rejectPayout(request.id)}>Reject</Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payout requests submitted.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
