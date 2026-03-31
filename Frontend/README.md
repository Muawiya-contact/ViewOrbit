# ViewOrbit Frontend

Developer instructions for running the Next.js frontend locally.

## Prerequisites

- Node.js 18+
- npm 9+
- Firebase project (Web + Admin credentials)

## Setup

```bash
npm install
```

## Local Environment

Create or verify:

```
.env.local
NEXT_PUBLIC_LOCAL_MODE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Admin System Setup

For the first time, create an admin account:

```bash
npm run seed:admin
# Or manually insert into admins table (see ADMIN_QUICKSTART.md)
```

See [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md) for testing the admin panel.

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### Access Points:

- **User App**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin (after login)

## Build

```bash
npm run build
npm run start
```

## Documentation

- **[ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)** - Complete admin system documentation
- **[ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md)** - 60-second admin setup guide

## Auth & Security Notes

- User auth via Firebase Auth (token cookie)
- Admin auth via Firebase Auth + Firestore `admins` collection
- Server-side APIs use Firebase Admin SDK
- Middleware protects routes by role

## Features

### User Features

- ✅ Email/password authentication
- ✅ Task browsing and submission
- ✅ Wallet with point system
- ✅ Screenshot uploads
- ✅ Payout requests

### Admin Features

- ✅ Admin login (separate auth)
- ✅ Pending task review and approval
- ✅ User management and statistics
- ✅ Wallet point control
- ✅ Task lifecycle management

- Auth session is persisted in secure Firebase token cookies.
- Protected routes are enforced in `middleware.ts` and `app/(dashboard)/layout.tsx`.
- Admin pages verify access from Firestore `admins/{uid}` records.
