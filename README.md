# Clover Desk

Personal productivity dashboard built with React, Vite, Tailwind CSS, localStorage, and PWA support.

## Run

```bash
npm install
npm run dev
npm run build
npm run preview
```

Login for the MVP:

- ID: `eunbibi`
- Password: `986454`

## Vercel

Import the folder into Vercel. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.

## Supabase migration note

The app talks to storage and auth through adapters under `src/lib`. Replace `localStorageAdapter.js` and `localAuthAdapter.js` with Supabase-backed adapters exposing the same method names. Add `user_id` to each future table so every record can be scoped to the logged-in user.
