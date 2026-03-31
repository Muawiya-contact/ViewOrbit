# Quick Start: Admin Panel

## 60-Second Setup

### 1. Add First Admin to Supabase

In Supabase SQL Editor, run:

```sql
-- First, generate a bcrypt hash
-- Use Node.js to create: await hashPassword("Admin@12345")
-- Replace $2b$12$... with actual hash

INSERT INTO public.admins (
  email,
  password_hash,
  full_name,
  is_active
) VALUES (
  'admin@example.com',
  '$2b$12$...',  -- Replace with actual bcrypt hash
  'Default Admin',
  true
);
```

To generate the hash:

```javascript
// In Node.js:
import bcrypt from "bcrypt";
const hash = await bcrypt.hash("Admin@12345", 12);
console.log(hash);
```

### 2. Access Admin Panel

1. Visit `http://localhost:3000/admin/login`
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `Admin@12345`
3. Click "Sign In"
4. Now in admin dashboard!

### 3. Try Admin Features

**Pending Tasks Tab**:

- Shows all tasks waiting for approval
- Click "Approve" to credit points to user
- Click "Reject" to send back for revision

**Users Tab**:

- View all registered users
- See their current point balances
- Filter by role

---

## What Just Happened?

✅ Admin authenticated with secure password hash  
✅ Session stored in browser (localStorage)  
✅ Full admin dashboard loaded with real data  
✅ Task approval workflow ready  
✅ User management available

---

## Test Task Approval Flow

### Create & Submit a Task

1. Log in as regular user (or create account)
2. Go to `/dashboard/tasks`
3. Create a new task
4. Submit it (change status to "pending")

### Approve as Admin

1. Go to `/admin` (bookmark this!)
2. Click "Tasks" tab
3. Find your submitted task
4. Click "Approve"
   - ✅ Task marked as "approved"
   - ✅ Points added to wallet
   - ✅ User can see points in dashboard

---

## Important Notes

⚠️ **Admin Accounts are SEPARATE from User Accounts**

- Admin table is independent
- Use different email for admin vs user account
- Admin cannot use user app features directly

⚠️ **Passwords are NOT Recoverable**

- Stored as bcrypt hashes (one-way)
- Cannot be reset yet (coming soon)
- Keep credentials safe!

⚠️ **RLS Policies Enforce Security**

- Admins can see all user data
- Regular users only see their own data
- API requests are server-validated

---

## Troubleshooting

**Can't log in?**

```
→ Check email/password exact match
→ Verify admin record exists in Supabase
→ Check password_hash format (should start with $2b$)
```

**Dashboard loads but nothing shows?**

```
→ Refresh page with Cmd+Shift+R (hard refresh)
→ Check browser console for errors
→ Verify admin has RLS access to tables
```

**Approve button doesn't work?**

```
→ Check browser console for error message
→ Verify task exists and is in "pending" status
→ Try creating and submitting a new task first
```

---

## Next Steps

1. ✅ Create production admin account
2. [ ] Set strong password (12+ chars, special chars)
3. [ ] Add more admin users as needed
4. [ ] Import real user tasks
5. [ ] Start approving submissions!

---

## Security Reminders

- 🔒 Never share admin credentials
- 🔒 Use strong passwords (8+ chars minimum, 12+ recommended)
- 🔒 HTTPS only in production (already enforced)
- 🔒 Audit logs coming soon
- 🔒 2FA coming soon

---

See [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) for complete documentation.
