# Credit Card Statements Gmail Integration Plan

## Goal
Add a dedicated Credit Card Statements dashboard flow that:
- fetches RCBC statement emails from `boaz.sze@gmail.com` (newest to oldest),
- downloads statement attachments into `data/credit-card-statements/`,
- shows processing status in a new dashboard view and control-rail entry.

## Current Repo Anchors
- Dashboard shell and Control Rail: `apps/dashboard/app/page.js`
- Existing analytics page pattern: `apps/dashboard/app/expenses/page.js`
- Existing file-based data analytics pattern: `apps/dashboard/lib/expensesCsv.js`
- Existing App Router API pattern: `apps/dashboard/app/api/*/route.js`

## UI/UX Finalized Spec (Using `ui-ux-pro-max` + Existing Dashboard Language)
Design-system files were generated and persisted:
- `design-system/bobot-dashboard/MASTER.md`
- `design-system/bobot-dashboard/pages/credit-card-statements.md`

Final direction for this repo keeps Bobot's current visual language (cards, mesh background, KPI grids, lucide icons), then applies the new page-specific content model.

### 1. Control Rail (Sidebar) Addition
- Add one new interactive item in the Control Rail on home (`/`):
  - Label: `Credit Card Statements`
  - Subtext: `RCBC SOA sync and processing`
  - Action: navigate to `/credit-card-statements`
  - Status chip: `pending count` badge (if `pending > 0`)
- Keep existing `Settings` entry untouched.

### 2. New View: `/credit-card-statements`
- Hero section:
  - Title: `Credit Card Statements`
  - Subtitle: `RCBC statement intake from Gmail to local archive`
  - Context nav links: back to hub and expenses page (same pattern as expenses/laundry pages)
- KPI band (required):
  - `Total Statements`
  - `Total Processed`
  - `Total Pending`
- Intake panel:
  - `Sync from Gmail` button
  - `Newest -> Oldest` note
  - last sync timestamp + result summary
- Statement queue/list:
  - Columns: statement month/date, source email date, filename, status, size
  - Default sort: newest email date first
  - Status colors: processed=success, pending=warn, failed=danger

### 3. UX States (Required)
- Loading: skeleton cards/spinner during sync and initial analytics load.
- Empty: "No statements downloaded yet" with clear call-to-action to sync.
- Error: non-blocking inline error panel for auth/download failures.
- Accessibility: keep visible focus states and reduced-motion behavior from existing `globals.css`.

## Data Contract and Folder Layout
Create/maintain:
- `data/credit-card-statements/`
- `data/credit-card-statements/raw/` (downloaded files)
- `data/credit-card-statements/manifest.json` (state index)

`manifest.json` structure (minimal):
- `lastSyncedAt` (ISO string)
- `items[]` with:
  - `id` (stable hash from `messageId + attachmentId`)
  - `messageId`
  - `attachmentId`
  - `emailDate`
  - `subject`
  - `from`
  - `filename`
  - `savedPath`
  - `status` (`pending | processed | failed`)
  - `processedAt` (nullable)
  - `error` (nullable)

Idempotency rule:
- Never redownload if `id` already exists in manifest.

## Gmail Integration Plan
## Recommended Auth Path (for this local personal assistant)
Use Gmail API OAuth2 with readonly scope:
- scope: `https://www.googleapis.com/auth/gmail.readonly`
- store token in local app data (not in git), e.g. `apps/dashboard/.data/gmail-token.json`

Why:
- safer than broad mailbox write scopes,
- reliable attachment access via Gmail API endpoints,
- fits local dashboard architecture.

## Email Fetching Rules
- Query target: RCBC SOA emails only (configurable query string).
- Fetch order: newest to oldest.
- For each matching message:
  - inspect MIME parts for attachments,
  - accept statement-like filenames (`.pdf`, optionally `.csv`),
  - download attachment bytes,
  - write to `data/credit-card-statements/raw/`,
  - upsert manifest row as `pending`.

Suggested env keys:
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REDIRECT_URI`
- `GMAIL_REFRESH_TOKEN`
- `RCBC_GMAIL_QUERY` (example: `from:(rcbc) (\"statement of account\" OR soa) has:attachment`)

## Processing Rules
For this phase, "processed" means attachment is downloaded and indexed successfully.
- On successful download + manifest write: `status=processed`.
- If download fails: `status=failed` with captured error.
- Pending only used for in-flight or retryable items.

## API Surface (Minimal)
- `GET /api/credit-card-statements/analytics`
  - returns totals for `totalStatements`, `totalProcessed`, `totalPending`
- `GET /api/credit-card-statements/list`
  - returns manifest items sorted newest -> oldest
- `POST /api/credit-card-statements/sync`
  - triggers Gmail fetch + attachment download + manifest upsert
- `GET /api/credit-card-statements/source`
  - optional debug endpoint to inspect local folder/manifest path

## File Touchpoints (Planned)
- `apps/dashboard/app/page.js`
  - add Control Rail entry link to `/credit-card-statements`
- `apps/dashboard/app/credit-card-statements/page.js` (new)
  - new statements dashboard view
- `apps/dashboard/app/api/credit-card-statements/analytics/route.js` (new)
- `apps/dashboard/app/api/credit-card-statements/list/route.js` (new)
- `apps/dashboard/app/api/credit-card-statements/sync/route.js` (new)
- `apps/dashboard/lib/creditCardStatements.js` (new)
  - folder paths, manifest read/write, analytics calculator
- `apps/dashboard/lib/gmailStatements.js` (new)
  - Gmail API client + message/attachment retrieval
- `apps/dashboard/.env.example`
  - add Gmail + query keys
- `apps/dashboard/app/globals.css`
  - only minimal classes if existing classes are insufficient

## Evaluator-Optimizer Verification Plan
1. Build control-rail entry + route shell  
   Evaluator Verification: `/credit-card-statements` is reachable from Control Rail and renders all 3 KPI cards.
2. Implement local manifest analytics/list APIs  
   Evaluator Verification: `GET analytics` and `GET list` return valid JSON with zero-data defaults on clean repo.
3. Implement Gmail sync endpoint (newest -> oldest)  
   Evaluator Verification: `POST sync` downloads matching RCBC attachments into `data/credit-card-statements/raw/` and writes manifest without duplicates on second run.
4. Wire UI to sync/list/analytics  
   Evaluator Verification: KPI counts and list rows update correctly after sync without full page reload.
5. Regression smoke check  
   Evaluator Verification: home page, laundry page, and expenses page still load with no runtime errors.

## Risks and Controls
- RCBC sender/subject variations can miss statements.  
  Control: keep `RCBC_GMAIL_QUERY` configurable and visible in docs.
- OAuth token expiration or consent misconfiguration.  
  Control: surface clear sync error states and provide one-time token setup script.
- Duplicate downloads from overlapping query results.  
  Control: manifest idempotency key (`messageId + attachmentId`).

## Next Implementation Sequence
1. Implement data/manifest layer and analytics/list APIs.
2. Add sync API with Gmail connector and newest-to-oldest ingestion.
3. Build `/credit-card-statements` page UI and connect APIs.
4. Add new Control Rail item in home sidebar.
5. Validate full flow with one real sync run against `boaz.sze@gmail.com`.
