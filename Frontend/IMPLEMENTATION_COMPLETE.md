# ViewOrbit Backend Implementation Summary

## Overview

Complete Firebase backend architecture with Firestore schema, scalable services, centralized auth middleware, and production-safe API endpoints.

---

## 1. Firestore Schema Design

| Collection                       | Purpose                  | Key Fields                               | Lifecycle                 |
| -------------------------------- | ------------------------ | ---------------------------------------- | ------------------------- |
| `users/{uid}`                    | User identity & wallet   | points, completedVideos, reputationScore | Create on first auth      |
| `channels/{channelId}`           | YouTube channel registry | ownerUserId, status                      | Admin approval flow       |
| `videos/{videoId}`               | Video master data        | youtubeVideoId, completedViews           | Auto-populated from tasks |
| `tasks/{taskId}`                 | Task definitions         | title, rewardPoints, isActive            | Admin-managed             |
| `taskAssignments/{assignmentId}` | Per-user task instances  | assignedUserId, status, watchProgress    | Created per assignment    |
| `payoutRequests/{payoutId}`      | Withdrawal history       | amountPoints, status, reviewedBy         | Admin approval required   |
| `settings/default`               | Platform settings        | pointsPerUnit, pkrPerUnit                | Admin configurable        |

---

## 2. API Endpoints Implemented

### User APIs (Protected by Firebase ID tokens)

| Method | Endpoint               | Purpose                                       |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/api/tasks`           | Get or assign next task                       |
| POST   | `/api/tasks`           | Assign next task                              |
| PATCH  | `/api/tasks`           | Update task progress (watch/like/comment)     |
| POST   | `/api/tasks/assign`    | Explicitly assign or accept task              |
| POST   | `/api/tasks/complete`  | Mark task complete and claim reward           |
| GET    | `/api/tasks/available` | List available tasks                          |
| GET    | `/api/payouts`         | View withdrawal history + conversion settings |
| POST   | `/api/payouts`         | Create withdrawal request                     |
| GET    | `/api/wallet`          | Get current points                            |
| GET    | `/api/settings`        | Get public conversion rate                    |

### Admin APIs (Protected by admin session cookie)

| Method | Endpoint                  | Purpose                          |
| ------ | ------------------------- | -------------------------------- |
| POST   | `/api/admin/auth/login`   | Admin login with email/password  |
| POST   | `/api/admin/auth/logout`  | Admin logout                     |
| GET    | `/api/admin/auth/session` | Check admin session status       |
| GET    | `/api/admin/users`        | List all users with stats        |
| GET    | `/api/admin/tasks`        | List all task definitions        |
| POST   | `/api/admin/tasks`        | Create/update task               |
| POST   | `/api/admin/tasks/create` | Dedicated task creation endpoint |
| GET    | `/api/admin/payouts`      | View all payout requests         |
| POST   | `/api/admin/payouts`      | Approve/reject payout            |
| GET    | `/api/admin/settings`     | Get conversion settings          |
| PATCH  | `/api/admin/settings`     | Update conversion rate           |

---

## 3. Service Layer (lib/server/services/)

### task-assignment-service.ts

- `assignTaskToUser(uid, email)` – Assign next available task
- `listAvailableTasksForUser(uid, email)` – List eligible tasks
- `acceptTaskAssignment(uid, assignmentId)` – Accept assignment transition
- `createTaskDefinition(input)` – Create task by admin

### points-service.ts

- `getConversionSettings()` – Fetch PKR conversion rate
- `updateConversionSettings(input)` – Admin update rate
- `calculatePkr(points, settings)` – Server-side conversion

### payout-service.ts

- `createPayoutRequest(input)` – Request withdrawal (deducted from points)
- `approvePayoutRequest(input)` – Admin approve, send notification
- `rejectPayoutRequest(input)` – Admin reject, refund points

---

## 4. Authentication & Authorization Middleware

### lib/server/api-auth.ts

- `withUserApiAuth` – Wraps user endpoints, verifies Firebase ID token
- `withAdminApiAuth` – Wraps admin endpoints, verifies admin session
- `resolveUserApiContext(request)` – Extract & verify token from request
- Unified error responses for failed auth

### lib/server/firebase-admin.ts

- Firebase Admin SDK initialization with named app
- `getAdminAuth()` – Token verification
- `getAdminDb()` – Firestore access
- `verifyRequestUser()` – Extract UID/email from request token
- `verifyCookieUser()` – Session verification from cookie

---

## 5. Frontend Sync Components

| Component                 | Purpose                  | Status                                   |
| ------------------------- | ------------------------ | ---------------------------------------- |
| `redeem-payout-zone.tsx`  | Withdrawal request UI    | ✅ Integrated with APIs + live settings  |
| `admin/settings/page.tsx` | Admin conversion-rate UI | ✅ Read/write settings                   |
| `admin/tasks/page.tsx`    | Task CRUD + creation     | ✅ Wired to /api/admin/tasks/create      |
| Dashboard task listener   | Realtime task progress   | ✅ Listens to taskAssignments collection |

---

## 6. Data Flow Diagrams

### User Task Assignment Flow

```
User Dashboard → GET /api/tasks (Firebase token)
  → verifyRequestUser()
  → ensureUserProfile(uid)
  → assignTaskForUser(uid)
    → Check daily cap
    → Find assignable video
    → Create taskAssignment doc
    → Return AssignedTaskResponse
  → Dashboard displays task + video player
```

### Task Completion & Reward

```
User completes video → POST /api/tasks/complete (taskId)
  → completeTaskAndReward(uid, taskId)
    → Verify task belongs to user
    → Check all requirements met
    → Transaction:
      - Deduct points if re-rewarded
      - Increment user.points + earnedPoints
      - Mark task.rewardGranted = true
      - Increment video.completedViews
      - Create transaction record
  → Return pointsAwarded
```

### Payout Request Flow

```
User requests payout → POST /api/payouts (amountPoints)
  → createPayoutRequest(userId, amountPoints, method, accountNumber)
    → getConversionSettings()
    → calculatePkr(amountPoints, settings)
    → Transaction:
      - Check user balance ≥ amountPoints
      - Deduct from user.points
      - Create payoutRequest doc (status: pending)
  → Admin reviews in /admin/payouts
  → POST /api/admin/payouts (approve/reject)
    → admin-verified request
    → Update status + reviewedBy
    → If rejected: refund points to user
    → Send notification
```

---

## 7. Key Production Safeguards

✅ **Token Verification**

- All user APIs verify Firebase ID token from request (Bearer header or cookie)
- All admin APIs verify session token from admin_session cookie
- Centralized middleware prevents auth bypass

✅ **Server-Side Calculations**

- Conversion rate (points → PKR) is **never** client-provided
- Always fetched from settings/default collection
- Prevents point manipulation

✅ **Transactions for Consistency**

- Point deduction + payout creation atomic
- Rejection refunds points atomically
- Task completion + user reward + video views atomic

✅ **Collection Separation**

- Tasks (definitions) vs TaskAssignments (instances)
- Allows high-volume queries without hotspot
- Admin manages tasks, users get assignments

✅ **Status Tracking**

- TaskAssignments track: assigned → in_progress → pending_review → completed
- PayoutRequests track: pending → approved/rejected
- Audit trail via reviewedBy + reviewedAt timestamps

✅ **Notification System**

- Payout approvals/rejections create notifications
- Notifications readable by user via notifications collection
- No approval/rejection without user notification

---

## 8. Recommended Firestore Indexes

Create composite indexes for high-volume queries:

```
Collection: taskAssignments
Fields:
  - assignedUserId (Ascending)
  - rewardGranted (Ascending)
  - createdTime (Descending)

Collection: payoutRequests
Fields:
  - userId (Ascending)
  - status (Ascending)
  - createdAt (Descending)

Collection: tasks
Fields:
  - isActive (Ascending)
  - createdAt (Descending)
```

---

## 9. Environment Configuration Required

```.env.local
# Firebase Admin SDK (server-only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# YouTube API (optional for live fetching)
YT_API_KEY=...
YT_CHANNEL_ID=...
```

---

## 10. Testing Checklist

- [ ] Register new user → user doc created in Firestore with 0 points
- [ ] Get task → first task assigned, taskAssignments doc created with status=assigned
- [ ] Update task progress → watchProgress updates, status transitions to in_progress
- [ ] Complete all requirements → status=pending_review
- [ ] POST /tasks/complete → points awarded, earnedPoints incremented
- [ ] Re-complete task → points not re-awarded, alreadyRewarded=true
- [ ] Request payout → amountPoints deducted, payoutRequest created (pending)
- [ ] Admin approves → status=approved, notification sent
- [ ] Admin rejects → status=rejected, amountPoints refunded, notification sent
- [ ] Update conversion rate → /api/payouts reflects new rate

---

## 11. Folder Structure

```
Frontend/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts (GET/POST/PATCH)
│   │   │   ├── assign/route.ts (POST)
│   │   │   ├── complete/route.ts (POST)
│   │   │   └── available/route.ts (GET)
│   │   ├── payouts/route.ts (GET/POST)
│   │   ├── wallet/route.ts (GET)
│   │   ├── settings/route.ts (GET)
│   │   └── admin/
│   │       ├── auth/
│   │       ├── tasks/
│   │       │   ├── route.ts (GET/POST/PATCH/DELETE)
│   │       │   ├── create/route.ts (POST)
│   │       │   └── [taskId]/...
│   │       ├── payouts/route.ts (GET/POST)
│   │       ├── users/route.ts (GET)
│   │       ├── settings/route.ts (GET/PATCH)
│   │       └── rules/route.ts
│   ├── admin/
│   │   ├── tasks/page.tsx
│   │   ├── payouts/page.tsx
│   │   └── settings/page.tsx
│   └── dashboard/page.tsx
├── lib/
│   ├── server/
│   │   ├── firebase-admin.ts
│   │   ├── api-auth.ts
│   │   ├── task-engine.ts
│   │   └── services/
│   │       ├── task-assignment-service.ts
│   │       ├── points-service.ts
│   │       └── payout-service.ts
│   └── types/
│       ├── firestore.ts
│       └── task-engine.ts
└── components/
    └── dashboard/
        └── redeem-payout-zone.tsx
```

---

## 12. Deployment Checklist

- [ ] Firebase Admin SDK credentials in production environment
- [ ] Firestore security rules deployed:
  - Users can only read/write their own doc
  - Admins can read all docs
  - API routes write via service account
- [ ] Firestore indexes created (see section 8)
- [ ] YouTube API key configured (if using live feed)
- [ ] Error logs aggregated (Sentry, LogRocket, etc.)
- [ ] Monitoring on 401/500 rates in API routes
- [ ] Admin session timeout policy
- [ ] Rate limits on /payouts and /tasks endpoints

---

## 13. Future Enhancements

- **Task Verification**: External provider API calls (YouTube SDK for watch proof)
- **Dispute Resolution**: User appeal system for rejected payouts
- **Analytics**: Dashboard for admin to see points distribution, payout trends
- **Batch Processing**: Cron jobs to settle approved payouts daily
- **Leaderboard**: Top earners collection with weekly/monthly rankings
- **Referral Rewards**: Bonus points for inviting new users

---
