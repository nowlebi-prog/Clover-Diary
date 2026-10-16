# Clover Desk

React / Vite personal diary with account-scoped Supabase synchronization.

## Run and verify

Use Node >=22.12 and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm dev
```

## Production synchronization setup

1. Keep the existing Supabase project online. A paused project cannot accept diary saves.
2. Run `supabase-sync-migration.sql` in that project's SQL Editor. It is repeatable and retains existing `app_data` rows. For a fresh project, `supabase-setup.sql` contains the same schema.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel for Production (and Preview if required), then deploy. Use the publishable/anon client key; never put service-role keys in a VITE variable.
4. Sign into every device with the same existing Supabase Auth email/password. The old local username/password is a separate login and is not a Supabase account.
5. On each device containing old records, open Settings, download **전체 기록·복구 사본 백업**, then use **이 기기의 기존 기록 가져오기**. The legacy browser keys remain untouched. Wait for **서버 저장 완료**.

Without Supabase configuration the app remains local-only and explicitly says so. Do not enable the deprecated anonymous public snapshot adapter for personal diary data.

## Data durability

- Edits save to browser storage immediately, including silent daily-note/timer edits and the floating scratch memo.
- Each authenticated user has a separate cache, acknowledgement baseline and recovery history. Legacy data is imported explicitly, never automatically into an arbitrary account.
- Sync compares the last acknowledged server version, current browser records and the newest server records. It merges independent fields and per-ID records. Concurrent changes to the same value keep a recovery copy of both versions.
- The Postgres RPC uses an atomic revision check. A losing writer re-reads and merges instead of replacing another device's snapshot.
- Failed writes remain pending across reloads. The app retries on the five-second timer, focus, reconnect and visibility changes. Closing a browser before the network completes is safe for the local record; the next visit retries it. Server save status is shown only after acknowledgement.
- Remote application preserves the preceding local snapshot separately (latest 12 snapshots), rather than replacing the same backup with server data. Settings exports the current data, recovery snapshots and conflict archive as JSON.
- Keep a downloaded backup before clearing browser storage or reinstalling a browser. Local-only/offline records depend on that browser until server acknowledgement.

## Local browser verification fixture

The fixture contains fake credentials and no real user data. Start `node tests/fixtures/mock-supabase.mjs` and create an ignored `.env.local` containing:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54329
VITE_SUPABASE_ANON_KEY=test-only-anon-key
```

Start Vite bound to `127.0.0.1`. Open `http://127.0.0.1:5173` and `http://localhost:5173` to exercise separate browser stores using `test@example.invalid` / `test-only-password`. The loopback-only fixture's `POST /__test/offline` accepts `{ "offline": true }` or `false` for disconnection/retry tests. Remove `.env.local` before testing a real project or preparing a production build. Never deploy the fixture or its environment file.

## Deployment

Vercel uses `pnpm install --frozen-lockfile`, `pnpm run build`, output `dist`, with SPA rewrites in `vercel.json`. Commit `package.json` and `pnpm-lock.yaml` together.
