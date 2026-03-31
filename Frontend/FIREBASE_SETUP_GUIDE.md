# Firebase Admin SDK Setup Guide

## Issue Identified

The 500 errors on `/api/tasks` endpoint are caused by **missing Firebase Admin SDK credentials** in your `.env.local` file.

## Root Cause

When the backend tries to verify ID tokens and access Firestore, it needs Firebase Admin SDK credentials which are currently not configured.

## Solution: Configure Firebase Admin SDK

### Step 1: Get Your Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Settings** → **Service Accounts** → **Firebase Admin SDK**
4. Click **Generate New Private Key**
5. A JSON file will download (e.g., `vieworbit-xxxxx.json`)

### Step 2: Update `.env.local`

Open `Frontend/.env.local` and add ONE of these options:

**Option A: Direct JSON (recommended for development)**

```env
FIREBASE_ADMIN_SDK_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-xxx@iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/..."}
```

To do this easily:

1. Open the downloaded JSON file in a text editor
2. Copy all the content
3. Paste into the `.env.local` value above

**Option B: Individual variables**

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_SDK_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_ADMIN_SDK_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### Step 3: Restart Development Server

```bash
# Kill running dev server
# Then restart:
npm run dev
```

## Verification

Once configured:

1. The `/api/tasks` endpoint should return **401 (Unauthorized)** if token is expired (this is normal)
2. Token will auto-refresh thanks to the new `fetchWithAuth` utility in `lib/client/fetch-with-auth.ts`
3. Firestore operations will work correctly
4. No more "Could not load the default credentials" errors

## Important Notes

- **Never commit credentials to git** - keep `.env.local` in `.gitignore`
- The `FIREBASE_ADMIN_SDK_JSON` variable must have newlines properly escaped as `\n`
- If using monorepo, credentials go in `Frontend/.env.local` (not root)

## Testing Task Assignment

After setup:

1. Log in to the dashboard
2. Click "Get Task" or navigate to the viewer dashboard
3. Task should load without 500 errors
4. If token expires during session, it auto-refreshes (thanks to new `fetchWithAuth` wrapper)

## Troubleshooting

- **Still seeing 500?** Check `.env.local` is in the correct folder (`Frontend/`)
- **"Invalid credentials" error?** Verify JSON is properly escaped (all newlines are `\n`)
- **Tasks still not loading?** Make sure Firestore collections exist (check Firebase Console)
