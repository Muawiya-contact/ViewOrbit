# Task-Based Engagement Platform Backend

## 1) Firestore Schema

### `users/{uid}`
- `uid: string`
- `email: string`
- `role: "user" | "admin"`
- `walletType: "JazzCash" | "EasyPaisa"`
- `walletNumber: string`
- `points: number` (default `10`)
- `streak: number` (default `0`)
- `createdAt: timestamp`
- `lastLogin: timestamp`
- `status: "active"`

### `tasks/{taskId}`
- `taskId: string`
- `videoId: string`
- `videoUrl: string`
- `channelId: string`
- `taskType: "view" | "like" | "subscribe" | "comment"`
- `rewardPoints: number`
- `maxUsers: number`
- `assignedUsersCount: number`
- `status: "active" | "completed"`
- `createdAt: timestamp`
- `createdBy: string`

### `taskAssignments/{assignmentId}`
- `assignmentId: string`
- `taskId: string`
- `userId: string`
- `status: "assigned" | "completed" | "skipped"`
- `proof?: string`
- `createdAt: timestamp`
- `completedAt?: timestamp`

### `redemptions/{redeemId}`
- `redeemId: string`
- `userId: string`
- `pointsUsed: number`
- `pkrAmount: number`
- `walletType: "JazzCash" | "EasyPaisa"`
- `walletNumber: string`
- `status: "pending" | "processing" | "paid" | "rejected"`
- `createdAt: timestamp`
- `processedAt?: timestamp`

### `comments/{commentId}`
- `text: string`
- `createdAt: timestamp`
- `createdBy: string`

### `channels/{channelId}`
- `channelName: string`
- `channelUrl: string`
- `status: "active" | "inactive"`
- `createdAt: timestamp`
- `createdBy: string`

### `settings/platform`
- `pointToPKR: number` (default `0.1`, i.e. `100 points = 10 PKR`)
- `minRedeemPoints: number` (default `100`)
- `maxDailyTasks: number` (optional, admin configurable)

## 2) Implemented API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `POST /api/create-task`
- `GET /api/get-random-task`
- `POST /api/complete-task`
- `POST /api/redeem`
- `GET /api/admin/tasks`
- `GET /api/admin/users`
- `GET /api/admin/redemptions`
- `GET|POST /api/admin/comments`
- `GET|POST /api/admin/channels`

## 3) Core Logic

### Task assignment
Implemented in `lib/server/services/platform-service.ts` (`assignRandomTask`):
- Loads active tasks
- Randomizes selection
- Rejects tasks already assigned to same user
- Enforces `assignedUsersCount < maxUsers`
- Creates `taskAssignments/{assignmentId}`
- Atomically increments `tasks.assignedUsersCount`

### Task completion
Implemented in `lib/server/services/platform-service.ts` (`completeTask`):
- Verifies assignment exists and belongs to current user
- Marks assignment as `completed`
- Stores optional `proof`
- Credits reward points to user in same transaction

### Redemption
Implemented in `lib/server/services/platform-service.ts` (`redeemPoints`):
- Reads conversion settings from `settings/platform`
- Validates min redeem points and user balance
- Deducts points immediately
- Creates `redemptions/{redeemId}` with `pending` status

## 4) TypeScript Models

Defined in:
- `lib/types/user.ts`
- `lib/types/platform.ts`

## 5) Security Rules

Defined in `firestore.rules`:
- Users read own user document
- Admins can read all users and write privileged collections
- Users can read tasks/channels/comments
- Users can create/update only their own assignments
- Users can create/read their own redemptions
- Admins can read/manage all redemptions/settings/tasks/channels/comments
- Points updates are intended via server API (Admin SDK bypasses rules)
