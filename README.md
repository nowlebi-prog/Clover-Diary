# Clover Desk

Personal productivity dashboard built with React, Vite, Tailwind CSS, localStorage, and PWA support.

## Run

```bash
npm install
npm run dev
npm run build
npm run preview
```

Local login is controlled by environment variables:

- `VITE_LOCAL_USERNAME`
- `VITE_LOCAL_PASSWORD`
- `VITE_MONEY_PASSWORD`

Do not commit real passwords or `.env` files to GitHub.

## Vercel

Import the folder into Vercel. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.

## Supabase migration note

The app talks to storage and auth through adapters under `src/lib`. Replace `localStorageAdapter.js` and `localAuthAdapter.js` with Supabase-backed adapters exposing the same method names. Add `user_id` to each future table so every record can be scoped to the logged-in user.

## Security notes

- Keep the GitHub repository private if this app stores personal diary, work, or money data.
- Set passwords and Supabase values in Vercel Project Settings > Environment Variables.
- Do not run `supabase-clover-sync.sql` for personal data. Use `supabase-setup.sql`, which scopes data by authenticated user.
- Public snapshot sync is disabled by default. Only enable `VITE_ENABLE_PUBLIC_SNAPSHOT_SYNC=true` for non-sensitive test data.
