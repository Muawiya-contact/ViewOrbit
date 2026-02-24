import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { isLocalMode } from "@/lib/config/env";

const adminRules = [
  "Complete at least 70% watch progress to receive points.",
  "Each task reward is granted only once per user.",
  "Keep your payout account details correct before withdrawing.",
  "Use respectful behavior when contacting support.",
];

export function ServiceInquiryZone() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Support Center</CardTitle>
          <CardDescription>Meet our customer care team and review admin rules in one place.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-medium">Customer Care Team</p>
            <p className="mt-1 text-sm text-muted-foreground">Email: support@vieworbit.local</p>
            <p className="text-sm text-muted-foreground">Hours: Mon - Sat, 10:00 AM - 7:00 PM</p>
            <p className="text-sm text-muted-foreground">WhatsApp: +92 300 0000000</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-medium">Admin Rules</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {adminRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
            Localhost mode: <span className="font-semibold text-foreground">{isLocalMode ? "Enabled" : "Disabled"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
