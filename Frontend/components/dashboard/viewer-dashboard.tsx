import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockActivity, mockVideos } from "@/lib/mock";

export function ViewerDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Points Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">4,820</p>
          <p className="mt-1 text-sm text-slate-500">+180 this week</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Video List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockVideos.map((video) => (
              <div key={video.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{video.title}</p>
                    <p className="text-xs text-slate-500">{video.duration} • {video.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">+{video.rewardPoints}</span>
                </div>
                <Progress className="mt-3" value={video.progress} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watch Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockVideos.map((video) => (
              <div key={`progress-${video.id}`}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{video.title}</span>
                  <span className="font-medium text-slate-900">{video.progress}%</span>
                </div>
                <Progress value={video.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>+{activity.points}</TableCell>
                  <TableCell className="capitalize">{activity.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
