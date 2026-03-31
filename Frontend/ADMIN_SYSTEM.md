# Admin Panel & Backend Documentation

## Overview

The ViewOrbit admin system provides a complete backend for managing tasks, users, submissions, and wallet administration. The system is built with:

- **Server-side SSR auth** with secure cookie handling
- **Admin-only routes** protected by middleware
- **Supabase PostgreSQL** for persistent data storage
- **Role-based RLS policies** for secure data access
- **Modular Zustand stores** for state management
- **bcrypt password hashing** for admin credentials
- **RESTful API routes** for backend operations

---

## Admin Panel Routes

### Login

- **URL**: `/admin/login`
- **Access**: Public (unauthenticated)
- **Purpose**: Admin authentication
- **Features**:
  - Email/password form
  - Error messaging
  - Redirect to dashboard on success

### Dashboard

- **URL**: `/admin`
- **Access**: Admin only (redirects to login if not authenticated)
- **Purpose**: Main admin control center
- **Tabs**:
  - **Tasks**: View pending submissions and approve/reject them
  - **Users**: View all registered users and their point balances
  - **Settings**: Admin account settings (coming soon)

---

## Authentication Flow

### Admin Login Process

```
User enters credentials at /admin/login
     ↓
POST /api/admin/auth/login
     ↓
authenticateAdmin() function:
  - Queries admins table for email
  - Verifies password with bcrypt
  - Updates last_login_at timestamp
  - Returns admin session data
     ↓
Store in useAdminStore (localStorage + state)
     ↓
Redirect to /admin dashboard
```

### Admin Session Persistence

- Admin session stored in `useAdminStore` (Zustand)
- Persists via localStorage with `persist` middleware
- Cleared on logout
- Not tied to Supabase auth (separate from user authentication)

---

## Database Schema

### Admins Table

```sql
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,          -- bcrypt hash
  full_name text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_by uuid REFERENCES admins(id),  -- auditing
  notes text
)
```

### Access Control (RLS Policies)

- **Admins can view all profiles** (users)
- **Admins can view all tasks** (including global tasks)
- **Admins can approve/reject tasks** and credit wallet points
- **Each user can only see their own data** (unless admin)

---

## API Routes

### Authentication

#### `POST /api/admin/auth/login`

Authenticate admin with email/password

**Request**:

```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:

```json
{
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "fullName": "Admin Name",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Task Management

#### `GET /api/admin/tasks/pending`

Get all pending tasks awaiting admin review

**Response**:

```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "platform": "YouTube",
      "status": "pending",
      "rewardPoints": 100,
      "progress": 100,
      "proofUrl": "https://...",
      "userId": "user-uuid",
      "userName": "User Name",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

#### `POST /api/admin/tasks/:taskId/approve`

Approve a task and automatically credit points to user's wallet

**Response**:

```json
{
  "success": true,
  "message": "Task approved and points awarded"
}
```

**Side Effects**:

- Task status changes to "approved"
- Wallet points for the user increases by reward_points
- Last approved_at timestamp recorded

#### `POST /api/admin/tasks/:taskId/reject`

Reject a task and reset it back to "in-progress"

**Response**:

```json
{
  "success": true,
  "message": "Task rejected and reset to in-progress"
}
```

### User Management

#### `GET /api/admin/users`

Get list of all users with their point balances

**Response**:

```json
{
  "users": [
    {
      "id": "user-uuid",
      "fullName": "User Name",
      "role": "viewer",
      "points": 500,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 42
}
```

---

## Frontend Components

### Admin Store (`lib/store/useAdminStore.ts`)

Manages admin session and dashboard data:

```typescript
// Login
const { login } = useAdminStore();
await login("admin@example.com", "password");

// Fetch data
const { fetchPendingTasks, fetchAllUsers } = useAdminStore();
await fetchPendingTasks();
await fetchAllUsers();

// Approve/reject
const { approveTask, rejectTask } = useAdminStore();
await approveTask(taskId);
await rejectTask(taskId);

// Session
const { admin, isLoggedIn, logout } = useAdminStore();
logout();
```

### Components

- **`components/admin/AdminDashboard.tsx`** - Main dashboard layout with tabs
- **`components/admin/AdminHeader.tsx`** - Header with logout button
- **`components/admin/PendingTasksView.tsx`** - Task review interface
- **`components/admin/UsersView.tsx`** - User list and statistics

---

## Password Management

### Utilities (`lib/auth/password.ts`)

#### `hashPassword(password: string)`

Hash password using bcrypt (12 rounds for security)

#### `verifyPassword(password: string, hash: string)`

Verify plain password against bcrypt hash

#### `validatePasswordStrength(password: string)`

Validate password meets security requirements:

- Minimum 8 characters
- Contains uppercase & lowercase
- Contains number
- Contains special character (!@#$%^&\*)

#### `generateTemporaryPassword()`

Generate temporary password for admin reset (format: `Temp@XXXXXX`)

### Server Admin Utilities (`lib/auth/admin.ts`)

#### `authenticateAdmin(email, password)`

Main login function - verify credentials and return session

#### `getAdminById(adminId)`

Fetch admin by ID

#### `changeAdminPassword(adminId, currentPassword, newPassword)`

Allow admin to change their own password

#### `createAdmin(email, firstName, createdByAdminId)`

Create new admin account (requires creator to be admin)

#### `resetAdminPassword(adminId, resetByAdminId)`

Reset admin password and generate temporary password

---

## Local Testing Setup

### 1. Prerequisites

Ensure you have:

- Node.js 18+
- Supabase project running with credentials in `.env.local`
- Admin table created in database

### 2. Create Test Admin

Option A - Direct Supabase Insert:

```sql
-- Generate hashed password in Node.js first:
-- const hash = await hashPassword('Temp@Admin123');

INSERT INTO public.admins (email, password_hash, full_name, is_active)
VALUES ('admin@test.local', '$2b$12$...', 'Test Admin', true);
```

Option B - Use admin creation API (requires existing admin)

### 3. Start Development Server

```bash
cd Frontend
npm run dev
```

Visit `http://localhost:3000`

### 4. Test Admin Login

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `admin@test.local`
   - Password: `Temp@Admin123`
3. Should redirect to `/admin` dashboard

### 5. Test Task Approval

1. Create a test task in user dashboard
2. Submit it (change status to "pending")
3. View pending tasks in admin dashboard
4. Click "Approve" - should credit points to user wallet
5. Verify in user's dashboard: points shown in wallet

### 6. Test User List

1. Go to "Users" tab on admin dashboard
2. Should display all registered users
3. Shows points balance for each user

---

## Troubleshooting

### "Invalid credentials" on login

- Verification password with bcrypt failing
- Check admin record exists in Supabase
- Verify password_hash is valid bcrypt format (starts with `$2b$`)

### Admin dashboard shows "No pending tasks"

- No tasks with status "pending" in database
- Create a test task and change its status manually
- Or mark an existing submission as "pending"

### Cannot approve tasks - 404 error

- Task ID might be invalid
- Verify taskId parameter in URL
- Check Supabase RLS policies - admin should have CRUD access

### Wallet not updating after approval

- Check wallets table has entry for user_id
- Verify RLS policies allow admin to update wallets
- Look for error logs in browser console

### Points not showing in user dashboard

- Verify points were updated in wallets table
- Refresh the page to sync state
- AuthProvider should sync wallet on mount

---

## Security Considerations

### Admin Authentication

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ Separate from user auth (no Supabase auth dependency)
- ✅ Session stored in localStorage (secure for SPA)
- ✅ Logout clears session

### Database Access

- ✅ RLS policies enforce admin-only access
- ✅ Admins can view all user data (necessary for moderation)
- ✅ Sensitive operations (approve/reject) verified server-side

### API Protection

- ✅ Admin status verified before task operations
- ✅ Input validation on all endpoints
- ✅ Error messages don't leak sensitive info

### Future Enhancements

- [ ] Add rate limiting on login endpoint
- [ ] Implement admin action audit logs
- [ ] Add 2FA for admin accounts
- [ ] Implement session timeout
- [ ] Add admin permission levels (super-admin, moderator, etc.)

---

## Development Tips

### Debug Admin Session

```typescript
import { useAdminStore } from "@/lib/store/useAdminStore";

// In component
const admin = useAdminStore((state) => state.admin);
console.log("Admin:", admin);
```

### Test API Routes Directly

```bash
# Test login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"Temp@Admin123"}'

# Test pending tasks
curl http://localhost:3000/api/admin/tasks/pending

# Test users
curl http://localhost:3000/api/admin/users
```

### Monitor Wallet Updates

In browser console:

```javascript
// Check if wallet update happened
fetch("/api/admin/tasks/TASK_ID/approve", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
```

---

## Next Steps

1. **Create seed script** for test admin accounts
2. **Add screenshots upload** functionality to tasks
3. **Implement payout request** approval system
4. **Add admin action logs** for audit trail
5. **Create password reset email** functionality
6. **Add dashboard analytics** (charts, stats)
7. **Implement task categories** for better organization

---

## Files Changed

- `supabase/schema.sql` - Added admins table + RLS policies
- `lib/auth/password.ts` - Password hashing utilities
- `lib/auth/admin.ts` - Admin auth functions
- `lib/store/useAdminStore.ts` - Admin state management
- `app/admin/login/page.tsx` - Login page
- `app/admin/page.tsx` - Dashboard page
- `app/api/admin/auth/login/route.ts` - Login API
- `app/api/admin/tasks/pending/route.ts` - Pending tasks API
- `app/api/admin/tasks/[taskId]/approve/route.ts` - Task approve API
- `app/api/admin/tasks/[taskId]/reject/route.ts` - Task reject API
- `app/api/admin/users/route.ts` - Users list API
- `components/admin/AdminDashboard.tsx` - Main dashboard
- `components/admin/AdminHeader.tsx` - Header
- `components/admin/PendingTasksView.tsx` - Tasks view
- `components/admin/UsersView.tsx` - Users view
- `package.json` - Added bcrypt dependency
