# ViewOrbit

Developer setup for running ViewOrbit locally.

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+

## Local Run (Frontend)

1. Install dependencies
   ```bash
   cd Frontend
   npm install
   ```
2. Ensure local mode is enabled
   ```bash
   # Frontend/.env.local
   NEXT_PUBLIC_LOCAL_MODE=true
   ```
3. Start the dev server
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Local Build

```bash
cd Frontend
npm run build
npm run start
```

## Notes

- Local mode seeds demo tasks and an admin account for testing.
- Default local admin: admin@vieworbit.local / admin123
- Backend is a placeholder only (no server logic yet).
