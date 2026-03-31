"use client";

import { useEffect, useState } from "react";

interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  points: number;
  lifetimeEarned: number;
  completions: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users ?? []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p className="text-sm text-slate-300">Loading users...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Users</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Points</th>
              <th className="px-4 py-3 text-left">Lifetime</th>
              <th className="px-4 py-3 text-left">Completions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.fullName}</td>
                <td className="px-4 py-3">{user.points}</td>
                <td className="px-4 py-3">{user.lifetimeEarned}</td>
                <td className="px-4 py-3">{user.completions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
