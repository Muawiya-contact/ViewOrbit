# ViewOrbit Firebase Backend Architecture

## Firestore Schema

### users/{uid}

- userId: string
- email: string
- username: string
- role: viewer | channel-owner | admin
- points: number
- earnedPoints: number
- completedVideos: string[]
- watchHistory: string[]
- reputationScore: number
- linkedMethods: { jazzcash?: string; easypaisa?: string }
- createdAt: timestamp
- updatedAt: timestamp
- lastTaskDay: string (YYYY-MM-DD)
- tasksCompletedToday: number

### channels/{channelId}

- channelId: string
- ownerUserId: string
- youtubeChannelId: string
- channelUrl: string
- title: string
- status: pending | approved | rejected
- createdAt: timestamp
- reviewedAt: timestamp
- reviewedBy: string

### videos/{videoId}

- videoId: string
- creatorId: string
- youtubeVideoId: string
- title: string
- thumbnail: string
- requiredViews: number
- completedViews: number
- requiredLikes: number
- completedLikes: number
- requiredComments: number
- completedComments: number
- createdAt: timestamp

### tasks/{taskId}

Task definitions managed by admin.

- taskId: string
- title: string
- description: string
- platform: youtube | instagram | facebook | tiktok
- taskType: youtube | instagram | facebook | tiktok
- rewardPoints: number
- isActive: boolean
- dailyCap: number
- minAccountAgeDays: number
- status: available | pending | approved | rejected
- createdAt: timestamp
- updatedAt: timestamp
- createdBy: string

### taskAssignments/{assignmentId}

Per-user task instances and progress.

- assignmentId: string
- taskId: string
- videoId: string
- assignedUserId: string
- watchRequired: boolean
- likeRequired: boolean
- commentRequired: boolean
- watchCompleted: boolean
- likeCompleted: boolean
- commentCompleted: boolean
- rewardPoints: number
- watchProgress: number
- rewardGranted: boolean
- assignedDay: string
- status: assigned | in_progress | pending_review | approved | rejected | completed
- channelUrl: string
- commentText: string
- createdAt: timestamp
- acceptedAt: timestamp
- completedAt: timestamp

### payoutRequests/{payoutId}

- payoutId: string
- userId: string
- amountPoints: number
- amountPkr: number
- method: jazzcash | easypaisa
- accountNumber: string
- status: pending | approved | rejected
- createdAt: timestamp
- reviewedAt: timestamp
- reviewedBy: string
- rejectionReason: string

### settings/default

- settingsId: default
- pointsPerUnit: number
- pkrPerUnit: number
- minPayoutPoints: number
- updatedAt: timestamp
- updatedBy: string

## API Structure

### User APIs

- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks
- POST /api/tasks/assign
- POST /api/tasks/complete
- GET /api/tasks/available
- GET /api/payouts
- POST /api/payouts

### Admin APIs

- POST /api/admin/auth/login
- POST /api/admin/auth/logout
- GET /api/admin/auth/session
- GET /api/admin/users
- GET /api/admin/tasks
- POST /api/admin/tasks
- POST /api/admin/tasks/create
- GET /api/admin/payouts
- POST /api/admin/payouts
- GET /api/admin/settings
- PATCH /api/admin/settings

## Security and Token Verification

- User APIs use shared token verification middleware: lib/server/api-auth.ts -> withUserApiAuth.
- Admin APIs use shared session guard middleware: lib/server/api-auth.ts -> withAdminApiAuth.
- Verification source is Firebase Admin SDK: lib/server/firebase-admin.ts.

## Services

- lib/server/services/task-assignment-service.ts
  - assignTaskToUser
  - listAvailableTasksForUser
  - acceptTaskAssignment
  - createTaskDefinition

- lib/server/services/points-service.ts
  - getConversionSettings
  - updateConversionSettings
  - calculatePkr

- lib/server/services/payout-service.ts
  - createPayoutRequest
  - approvePayoutRequest
  - rejectPayoutRequest

## Recommended Folder Structure

- app/api/
  - tasks/
  - payouts/
  - settings/
  - admin/
- lib/server/
  - firebase-admin.ts
  - api-auth.ts
  - task-engine.ts
  - services/
- lib/types/
  - firestore.ts
  - task-engine.ts
  - foundation.ts

## Production Notes

- Keep all point-to-currency conversion server-side from settings/default.
- Never trust client-provided amountPkr.
- Use transactions for wallet deductions, payout creation, and reject refunds.
- Keep taskDefinitions and taskAssignments in separate collections for scale and query safety.
- Add indexes for high-volume queries in taskAssignments and payoutRequests.
