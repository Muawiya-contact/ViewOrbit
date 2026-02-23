"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

export function ChannelOwnerDashboard() {
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!channelName || !channelUrl) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField
              id="channelName"
              label="Channel Name"
              placeholder="Enter your channel name"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
            />
            <FormField
              id="channelUrl"
              label="Channel URL"
              placeholder="https://youtube.com/@yourchannel"
              value={channelUrl}
              onChange={(event) => setChannelUrl(event.target.value)}
            />
            <div className="md:col-span-2">
              <Button type="submit">Submit for Approval</Button>
            </div>
            {submitted ? <p className="text-sm text-emerald-600 md:col-span-2">Channel submitted successfully.</p> : null}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Approval Status", "Pending Review"],
          ["Active Campaigns", "03"],
          ["Total Earned", "$2,840"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Views", "Retention", "Revenue"].map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title} Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
