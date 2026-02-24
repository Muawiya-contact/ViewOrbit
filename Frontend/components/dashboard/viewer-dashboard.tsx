"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";

export function ViewerDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Viewer Dashboard</CardTitle>
          <CardDescription>This legacy dashboard has been replaced by the Home and Tasks tabs.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use the bottom navigation to access tasks, wallet, and support.</p>
        </CardContent>
      </Card>
    </div>
  );
}
