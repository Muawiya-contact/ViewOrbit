# Task System (Next.js + Firebase)

## Firestore Schema

### `users/{uid}`
- `uid: string`
- `email: string`
- `points: number`
- `walletType: "JazzCash" | "EasyPaisa"`
- `walletNumber: string`
- `createdAt: Timestamp`

### `tasks/{taskId}`
- `taskId: string`
- `videoId: string`
- `channelId: string`
- `taskType: "view" | "like" | "subscribe" | "comment"`
- `rewardPoints: number`
- `maxUsers: number`
- `createdAt: Timestamp`
- `status: "active" | "paused"`

### `taskAssignments/{assignmentId}`
- `assignmentId: string`
- `taskId: string`
- `userId: string`
- `status: "assigned" | "completed"`
- `createdAt: Timestamp`
- `completedAt: Timestamp | null`

### `comments/{commentId}`
- `commentId: string`
- `text: string`
- `createdAt: Timestamp`
- `createdBy: string`

## API Endpoints

### User APIs
- `POST /api/tasks/assign` - assign next available task
- `GET /api/tasks` - fetch/assign task for dashboard
- `PATCH /api/tasks` - update task progress (`watchProgress`, `likeCompleted`, `subscribeCompleted`, `commentCompleted`, `commentText`)
- `POST /api/tasks/complete` - complete assignment and credit points (`assignmentId` or `taskId`)
- `GET /api/tasks/available` - list available assignment payload

### Admin APIs
- `GET /api/admin/tasks` - list tasks
- `POST /api/admin/tasks` - create task definition
- `PATCH /api/admin/tasks` - update task definition
- `DELETE /api/admin/tasks?taskId=...` - delete task definition
- `GET /api/admin/comments` - list predefined comments
- `POST /api/admin/comments` - upload comments (`text` or `comments[]`)

## Security
- Firestore rules live in `firestore.rules`.
- Users can update only their own assignments.
- Users cannot directly increase points in `users`.
- Admin-only write access for `tasks` and `comments`.
