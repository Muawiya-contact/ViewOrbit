# Micro-Task Reward Platform (Production Blueprint)

## Stack
- Next.js 14 (App Router), TypeScript, TailwindCSS
- Firebase Auth, Firestore, Admin SDK, Cloud Functions
- Firebase Hosting

## Recommended Folder Structure
```txt
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  dashboard/page.tsx
  admin/
    page.tsx
    users/page.tsx
    tasks/page.tsx
    channels/page.tsx
    withdraws/page.tsx
  api/
    auth/signup/route.ts
    auth/login/route.ts
    user/profile/route.ts
    create-task/route.ts
    get-random-task/route.ts
    complete-task/route.ts
    redeem/route.ts
    admin/tasks/route.ts
    admin/users/route.ts
    admin/redemptions/route.ts
components/
  dashboard/
  admin/
hooks/
  useAuth.ts
  useRealtimeProfile.ts
lib/
  firebase.ts
  auth.ts
  server/
    firebase-admin.ts
    admin-access.ts
    services/
      user-service.ts
      platform-service.ts
types/
  user.ts
  platform.ts
functions/
  src/index.ts
```

## Firestore Schema

### `users/{uid}`
- `name`, `email`, `phone`
- `points`, `streak`, `tasksCompleted`
- `activeTaskId`, `redeemRequests`
- `isAdmin`, `createdAt`, `lastLogin`

### `tasks/{taskId}`
- `platform`, `channelId`, `videoUrl`
- `points`, `maxUsers`, `completedUsers`
- `active`, `createdAt`

### `channels/{channelId}`
- `platform`, `channelName`, `channelURL`
- `active`, `createdAt`

### `taskAssignments/{id}`
- `userId`, `taskId`
- `assignedAt`, `completed`, `completedAt`
- `pendingVerification`, `ipHash`, `fingerprintHash`

### `taskHistory/{id}`
- `userId`, `taskId`, `pointsEarned`
- `verified`, `createdAt`

### `withdrawRequests/{id}`
- `userId`, `phone`, `pointsUsed`
- `amountPKR`, `status`
- `createdAt`, `processedAt`

### `platformSettings/main`
- `pointsToPKR`, `minWithdrawPoints`, `dailyTaskLimit`

### `notifications/{id}`
- `type`, `userId`, `title`, `message`
- `read`, `createdAt`

## Required APIs
- `POST /api/create-task`
- `GET /api/get-random-task`
- `POST /api/complete-task`
- `POST /api/redeem`
- `GET /api/admin/tasks`
- `GET /api/admin/users`
- `GET /api/admin/redemptions`

## Anti-Cheat Controls
- 15-second cooldown before assigning next task
- Daily task limit from `platformSettings/main.dailyTaskLimit`
- Track assignment uniqueness (`userId + taskId`)
- Store hashed IP and fingerprint with assignment
- Block point updates from client-side rules

## Verification Strategy (YouTube)
- Require min 30 seconds watch telemetry
- Require comment text
- Function `verifyYouTubeComment` scans latest YouTube comments
- If not found: set `pendingVerification = true` for admin review

## Cloud Functions
- `onWithdrawRequestCreated`: notify admins in `notifications`
- `finalizeTaskCompletion`: idempotent rewards + history
- `verifyYouTubeComment`: hybrid engagement verification

## Deployment
1. `npm i -g firebase-tools`
2. `firebase login`
3. `firebase use <project-id>`
4. `cd functions && npm install && npm run build`
5. `cd .. && firebase deploy`
