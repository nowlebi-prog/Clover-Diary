# Reliable diary synchronization implementation plan

Goal: retain diary records across restarts and devices.
Architecture: account-scoped local cache, three-way merge, atomic server revisions, persistent retry state.
Tech stack: React, Vite, Supabase Auth/Postgres, Node test runner.
Spec: sync-design.md (approved in chat on 2026-10-16).

## 1. Merge and coordinator
- [ ] Add failing Node tests for delayed pulls, concurrent devices, deletes, conflicts, failed uploads and editing during uploads.
- [ ] Implement snapshotMerge.js with per-ID/per-field three-way merge and archived conflicts.
- [ ] Implement syncEngine.js single-flight pull/merge/compare-and-swap. Keep the acknowledged baseline separate from edits made while a request is running.
- [ ] Run node --test tests/*.test.js.

## 2. Durable browser storage and account lifecycle
- [ ] Add storage tests for backup preservation, silent writes, account separation and legacy imports.
- [ ] Remove anonymous snapshot polling from localStorageAdapter.js. Preserve pre-cloud recovery history and emit a dedicated local-write event, including silent UI saves.
- [ ] Wire Supabase authAdapter, LoginPage, App, Settings logout; scope local storage before mounting protected pages.
- [ ] Add Supabase revision migration and authenticated CAS RPC. Never upload legacy records to a new account automatically.

## 3. User visibility and verification
- [ ] Show pending, syncing, saved, offline, error and local-only status in the app shell and Settings.
- [ ] Add downloadable full backups/recovery and explicit legacy import controls.
- [ ] Update setup instructions and both lockfile/deployment package-manager configuration consistently.
- [ ] Run Node tests and production build, then use two browser contexts to check persistence and offline/reconnect if the test environment supports it.
- [ ] Copy only verified changed files back to the requested repository, preserving the original source backup. Report deployment/backend verification separately.
