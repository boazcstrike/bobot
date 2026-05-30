# Bobot MongoDB Integration Plan (Data Folder Preserved)

## Goal
Add MongoDB as the long-term storage backend while keeping all existing local files in `data/` untouched.

## Current State (May 30, 2026)
- Existing source files under `data/`:
  - `data/Assets and Expenses 2012-2024 - OUT.csv`
  - `data/profanity.js`
- Dashboard currently uses:
  - Prisma + local SQLite (`DATABASE_URL`)
  - File reads for expense CSV

## Phase 0 (Now): Connection Validation
- Standard env keys:
  - `MONGODB_URI` (standard URI key)
  - `MONGODB_DB_NAME` (target database name)
- Keep legacy fallback key for compatibility:
  - `MONGO_DB_CONNECTION_STRING`
- Add checker route:
  - `GET /api/mongodb/check`
  - Runs `ping` against MongoDB and returns `ok: true/false`

## Phase 1: Read-Only Mirror Import
- Do not change existing reads from `data/`.
- Build import scripts that copy local data into Mongo collections:
  - `expenses_records` from CSV
  - `profanity_terms` from `profanity.js`
- Add idempotency keys so repeated imports do not duplicate records.

## Phase 2: Dual Write
- Keep local `data/` writes exactly as they are.
- Add Mongo write in parallel for new or updated records.
- Add a per-write result log with success/failure counters.

## Phase 3: Read Cutover by Flag
- Add feature flag `USE_MONGODB_READS=true|false`.
- Start with low-risk endpoints first.
- Keep fallback to file-based/local-db reads when Mongo check fails.

## Phase 4: Validation and Stability
- Validate row/document counts between local and Mongo datasets.
- Compare sample aggregates (totals, date buckets, category counts).
- Keep `data/` as canonical backup even after Mongo read cutover.

## Success Criteria
1. `GET /api/mongodb/check` returns `ok: true` with valid env config.
2. Existing `data/` files remain unchanged and readable.
3. Migration can proceed incrementally without downtime.
