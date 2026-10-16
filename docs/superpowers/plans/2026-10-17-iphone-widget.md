# Personal iPhone widget implementation plan

> **For agentic workers:** Execute inline with executing-plans and TDD. The user selected the previously proposed personal Scriptable approach; no additional platform or paid account is needed.

**Goal:** Deliver an installable Scriptable widget showing Clover's week, today's events and unfinished tasks.

**Architecture:** A standalone Scriptable script signs in directly to the existing Supabase project, reads only events/todos from the authenticated user's row, stores session and a limited agenda cache in iOS Keychain, and renders a native ListWidget. The existing Vite build injects only validated public Supabase configuration. A static installation page is accessible on iPhone; Settings links to it.

**Tech Stack:** Scriptable ListWidget/Alert/Request/Keychain, existing Vite/React, node:test.

**Spec:** Approved conversation: personal, fast setup; reference week-and-agenda image; same account as web diary; no native app distribution.

## Global constraints

- No database/schema/auth-policy changes; no diary writes by the widget.
- Never store passwords. Session tokens and a minimized seven-day cache stay in Keychain; never appear in URLs or source downloads.
- Keep offline cached data visibly marked with its last successful fetch time; never label failed network requests as a fresh save.
- Invalid/revoked sessions hide cached content and ask for login; switching accounts clears the old cache.
- iOS controls refresh timing; links open the diary for editing, no inline completion promised.
- The actual iPhone Scriptable installation/render remains a user-device check, distinct from Node/browser verification.

## Task 1: Tested widget logic and standalone runtime

**Files:** Create `widgets/CloverWidget.js`, `tests/iphoneWidget.test.js`.

- [ ] Write failing behavioral tests for local dates/week across month boundaries, multi-day events, overdue/no-date tasks, completed/unscheduled exclusions and time ordering.
- [ ] Write failing boundary tests for session refresh, account filtering, revoked-session handling, cache identity and offline fallback.
- [ ] Implement selection, session and transport behavior; run the focused tests until passing.
- [ ] Add compact medium/large layouts, week links, timestamp/status, native secure sign-in, account-change and local-logout actions.

## Task 2: Configuration, installation and verification

**Files:** Create `widgets/buildWidget.js`, `public/iphone-widget.html`; modify `vite.config.js`, `src/features/settings/SettingsPage.jsx`; extend widget tests.

- [ ] Test generated configuration rejects service-role/secret keys and unsafe URLs, includes only public fields, and emits executable standalone code.
- [ ] Add build/dev plugin and the iPhone guide with copy/download actions, medium-widget steps and refresh caveat.
- [ ] Run all existing tests and production build. Preview the actual guide at mobile dimensions and verify clipboard equals the compiled script.
- [ ] Review the changes, copy only the relevant source files into the clean source branch, verify again, and deploy through the existing GitHub/Vercel workflow if available.
- [ ] Verify the live guide and compiled script configuration without printing tokens. Deliver the URL and clearly identify the remaining physical iPhone check.
