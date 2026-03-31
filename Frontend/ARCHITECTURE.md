# ViewOrbit System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ViewOrbit Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐          │
│  │   User App       │          │   Admin Panel    │          │
│  │  /dashboard/*    │          │   /admin/*       │          │
│  │ (Public Users)   │          │ (Admins Only)    │          │
│  └────────┬─────────┘          └────────┬─────────┘          │
│           │                             │                    │
│           │ User Auth                   │ Admin Auth         │
│           │ (Supabase)                  │ (bcrypt in DB)     │
│           │                             │                    │
│  ┌────────▼─────────────────────────────▼─────────┐         │
│  │     Next.js 14 App Router + Middleware        │         │
│  │  - Route Protection                            │         │
│  │  - Session Management                          │         │
│  │  - API Routes (/api/*)                         │         │
│  └────────┬──────────────────────────────────────┘         │
│           │                                                   │
│  ┌────────▼──────────────────────────────────────┐         │
│  │   Supabase PostgreSQL Database                │         │
│  │  - Profiles (users)                           │         │
│  │  - Admins (new)                               │         │
│  │  - Tasks                                       │         │
│  │  - Wallets                                     │         │
│  │  - Screenshots                                 │         │
│  │  - Payout Requests                            │         │
│  │                                                 │         │
│  │  RLS Policies enforcing:                       │         │
│  │  - User can only see their own data            │         │
│  │  - Admin can see/modify all data               │         │
│  └──────────────────────────────────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Task Approval Example

### Scenario: User submits a task, admin approves it, points awarded

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SUBMITS TASK                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ User fills form → POST to /api/tasks/create                     │
│   ├─ Task created with status="available"                       │
│   ├─ User submits with proof (status="pending")                 │
│   └─ Task now waiting for admin review                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. ADMIN LOGS IN                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Admin visits /admin/login                                       │
│   ├─ Enters email + password                                    │
│   ├─ POST /api/admin/auth/login                                │
│   ├─ authenticateAdmin() verifies password with bcrypt          │
│   ├─ Session stored in useAdminStore                            │
│   └─ Redirected to /admin dashboard                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. ADMIN VIEWS PENDING TASKS                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Dashboard loaded → useEffect calls fetchPendingTasks()          │
│   ├─ GET /api/admin/tasks/pending                              │
│   ├─ Query returns all tasks where status="pending"             │
│   ├─ Admins RLS policy allows viewing all tasks                 │
│   ├─ PendingTasksView component renders list                    │
│   └─ User clicks "Approve" button                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. ADMIN APPROVES TASK                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Click "Approve" → POST /api/admin/tasks/:taskId/approve         │
│   ├─ Server verifies task exists and is "pending"               │
│   ├─ Updates task status to "approved"                          │
│   ├─ Gets task.reward_points and task.user_id                   │
│   ├─ Queries user's current wallet.points                       │
│   ├─ Sets new points = current + reward_points                  │
│   ├─ Updates wallets table (admin RLS allows)                   │
│   └─ Returns success response                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. USER SEES POINTS IN WALLET                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ User logs in / refreshes dashboard                              │
│   ├─ AuthProvider syncs session on mount                        │
│   ├─ Wallet component queries /wallets?user_id=...              │
│   ├─ RLS policy allows user to see own wallet                   │
│   ├─ New points displayed (previous + reward_points)            │
│   └─ User can now redeem points                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Architecture

### User Authentication (Existing, unchanged)

```
User Account Login
       ↓
Supabase Auth Email/Password
       ↓
JWT Token + Secure HTTP-Only Cookie
       ↓
Middleware validates on each request
       ↓
Session stays alive across requests
       ↓
useAuthStore syncs with Supabase auth state
```

### Admin Authentication (New)

```
Admin Account Login
       ↓
POST /api/admin/auth/login with email + password
       ↓
authenticateAdmin() function:
  ├─ Query admins table by email
  ├─ Get password_hash (bcrypt)
  ├─ Call bcrypt.compare(password, hash)
  └─ Return admin session if valid
       ↓
Store in useAdminStore (not Supabase auth)
       ↓
Session persists via localStorage
       ↓
Middleware checks admin status for /admin routes
```

**Key Difference**: Admin auth is completely separate from user auth. An admin and a user can have the same email but different auth systems.

---

## RLS (Row-Level Security) Policies

### User Can Only See Their Own Data

```sql
CREATE POLICY "tasks_select_own"
ON tasks FOR SELECT
USING (auth.uid() = user_id)
```

Result: User can only query their own tasks

### Admin Can See Everything

```sql
CREATE POLICY "tasks_admin_manage"
ON tasks FOR ALL
USING (
  EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()::uuid)
)
```

Result: Admin table membership grants full access

---

## File Structure

```
Frontend/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx               ← Admin login form
│   │   └── page.tsx                   ← Admin dashboard
│   ├── api/
│   │   └── admin/
│   │       ├── auth/
│   │       │   └── login/route.ts      ← Auth endpoint
│   │       ├── tasks/
│   │       │   ├── [taskId]/
│   │       │   │   ├── approve/route.ts
│   │       │   │   └── reject/route.ts
│   │       │   └── pending/route.ts
│   │       └── users/route.ts
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── support/page.tsx            ← Updated: removed old admin UI
│       └── ...
│
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx          ← Main layout
│   │   ├── AdminHeader.tsx
│   │   ├── PendingTasksView.tsx        ← Task list & approval
│   │   └── UsersView.tsx               ← User list
│   ├── dashboard/
│   │   └── admin-dashboard.tsx         ← DELETED (old component)
│   └── ...
│
├── lib/
│   ├── auth/
│   │   ├── admin.ts                    ← Server auth functions
│   │   ├── password.ts                 ← bcrypt utilities
│   │   ├── user.ts
│   │   └── server.ts
│   ├── store/
│   │   ├── useAdminStore.ts            ← Admin state (NEW)
│   │   ├── useAuthStore.ts
│   │   └── ...
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── supabase/
│   └── schema.sql                      ← Updated with admins table
│
├── middleware.ts                        ← Route protection
├── .env.local                           ← Supabase credentials
├── ADMIN_SYSTEM.md                      ← Complete docs (NEW)
├── ADMIN_QUICKSTART.md                  ← 60-sec setup (NEW)
└── README.md                            ← Updated
```

---

## State Management

### User State (useAuthStore)
- Managed by Supabase auth state
- Synced via onAuthStateChange listener
- Persists via Supabase session cookie

### Admin State (useAdminStore - NEW)
- Managed locally in Zustand store
- Persists via localStorage (not auth service)
- Can be cleared via logout()
- Independent from user auth

### Task/Wallet State (existing)
- useTaskStore
- useWalletStore
- useToastStore
- etc.

---

## API Request Flow

```
Frontend Component
       ↓
useAdminStore.approveTask(taskId)
       ↓
Fetch POST /api/admin/tasks/:taskId/approve
       ↓
[Server-side API Route]
  ├─ Read request body/params
  ├─ Get Supabase client
  ├─ Query tasks table
  ├─ Verify task.status = "pending"
  ├─ Update task → "approved"
  ├─ Calculate new points
  ├─ Update wallets table
  └─ Return success JSON
       ↓
Frontend receives response
       ↓
useAdminStore updates tasks list
       ↓
Component re-renders with updated task
```

---

## Security Layers

### Layer 1: Route Protection (Middleware)
- `/admin` and `/admin/*` routes check auth
- Redirect to `/admin/login` if not authenticated
- Verified at request time

### Layer 2: API Validation (Server)
- Each API route validates request
- Checks task exists and status is correct
- Validates numbers (reward_points > 0)

### Layer 3: Database RLS
- Even if API is bypassed, RLS blocks invalid data access
- Admins can only access if `EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()::uuid)`
- Users can only see their own data

### Layer 4: Password Security (bcrypt)
- Passwords hashed with 12-round bcrypt
- Never stored in plain text
- bcrypt.compare() used for verification
- One-way hash (cannot be reversed)

---

## Testing Checklist

- [ ] Admin login works with correct credentials
- [ ] Admin login fails with wrong password
- [ ] Pending tasks display correctly
- [ ] Approve button credits points
- [ ] Reject button resets task to in-progress
- [ ] User sees points in wallet after approval
- [ ] Logout clears admin session
- [ ] Cannot access /admin without login
- [ ] User cannot access admin routes

---

## Performance Considerations

### Queries Optimized For:
- ✅ List pending tasks (expected: 10-100s)
- ✅ Get all users (expected: 100-1000s)
- ✅ Single task approval (instant)
- ✅ Admin login (instant)

### Potential Bottlenecks:
- ⚠️ Many pending tasks (pagination needed)
- ⚠️ Large user list (search/filter needed)
- ⚠️ Frequent wallet updates (batch operations?)

### Future Optimization:
- [ ] Add pagination to pending tasks
- [ ] Add search to user list
- [ ] Cache admin dashboard data
- [ ] Add database indexes on status/user_id

---

## Emergency Procedures

### Admin Locked Out
1. Connect to Supabase directly
2. Reset password hash:
   ```sql
   UPDATE public.admins 
   SET password_hash = '$2b$12$...' 
   WHERE email = 'admin@example.com';
   ```

### Approval Stuck/Wrong State
1. Manually correct task status:
   ```sql
   UPDATE public.tasks 
   SET status = 'pending' 
   WHERE id = 'task-uuid';
   ```

### Points Not Added
1. Manual wallet correction:
   ```sql
   UPDATE public.wallets 
   SET points = points + 100 
   WHERE user_id = 'user-uuid';
   ```

---

## Future Enhancements (Prioritized)

### High Priority
1. **Screenshot Upload** - From task to Supabase storage
2. **Payout Approval** - Admin approves/rejects withdrawals
3. **Admin Audit Log** - Track all admin actions
4. **Password Reset** - Email-based or temp password

### Medium Priority
5. **Pagination** - For large lists
6. **Search/Filter** - Find tasks/users quickly
7. **Dashboard Analytics** - Stats and charts
8. **Bulk Operations** - Approve multiple at once

### Low Priority
9. **2FA for Admins** - Two-factor authentication
10. **Admin Roles** - Super-admin vs moderator
11. **Scheduled Tasks** - Auto-reject old pending
12. **Email Notifications** - Notify on approval/rejection

