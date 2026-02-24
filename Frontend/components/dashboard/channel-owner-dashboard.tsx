"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";

export function ChannelOwnerDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel Owner Area</CardTitle>
          <CardDescription>This demo now focuses on the viewer lifecycle and admin approvals.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use the Home and Tasks tabs to simulate the viewer journey. Admin approvals are available under Support for admin accounts.</p>
        </CardContent>
      </Card>
    </div>
  );
}
