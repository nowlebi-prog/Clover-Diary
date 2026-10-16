# Reliable diary synchronization

Approved direction: preserve existing records; authenticated per-user cloud storage; merge device edits without overwriting unsent changes; retry failures and show actual save status.

The app will retain the legacy browser data unchanged. Each cloud account gets a separate browser cache. Importing legacy records is explicit in Settings. Before applying remote changes, preserve a separate recovery snapshot. A three-way merge compares the last acknowledged server snapshot, the current local data, and the current server data. Merge records by ID and fields recursively; retain both conflicting values in a recovery archive. Server writes use an atomic revision check, retrying a merge after concurrent writes. Failed writes remain pending across browser restarts.

Use Supabase Auth with the existing project. Without cloud configuration, keep local mode with a clear local-only indicator. Never re-enable anonymous shared snapshots. Actual production verification requires access to the existing Supabase project and deployment configuration; do not claim production is fixed until that is checked.
