# Credit Card Statements Sync Methods Information (5.4-mini)

## ℹ️ Information
This project now supports two operational sync methods for RCBC statement ingestion into `data/credit-card-statements/`.

- Method A: Gmail API sync via env-based OAuth credentials.
- Method B: Chrome + Playwright MCP sync workflow (5.4-mini assisted operator flow).

Both methods write into the same manifest/file archive model so downstream analytics remain consistent.

## 🛰️ Method A: Gmail API Sync (Env-Based)
Use this for direct backend sync through `POST /api/credit-card-statements/sync`.

### Required Environment
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REDIRECT_URI`
- `GMAIL_REFRESH_TOKEN`
- `RCBC_GMAIL_TARGET_EMAIL` (recommended: `boaz.sze@gmail.com`)
- `RCBC_GMAIL_USER_ID` (default: `me`)
- `RCBC_GMAIL_QUERY` (default RCBC query)

### Why Choose This
- Stable backend API path.
- Works with dashboard button and API clients.
- Cleaner for repeatable automation jobs.

## 🧩 Method B: Playwright MCP + Chrome Sync (5.4-mini)
Use this when browser-session-driven operation is preferred, or when Gmail API credential setup is not the first path.

### Execution Model
- Connect through `playwright_extension` (primary) or `playwright_cdp` (fallback).
- Use the authenticated Chrome session (`boaz.sze@gmail.com`) to access Gmail search results.
- Run the sync flow through guided 5.4-mini operator actions.

### Why Choose This
- Fast bootstrap when browser auth/session is already active.
- Useful for interactive/operator-assisted runs.
- Good fallback path when API OAuth pipeline is blocked.

## 🕒 Period-Scoped Sync (No Full-Mailbox Scan by Default)
The statement sync flow supports period targeting so we do not query all history at once.

### Dashboard Controls
- `From timestamp`
- `To timestamp`
- `Sync selected period` button
- `Sync newest since latest` button
- `Oldest in archive` and `Latest in archive` timestamps displayed

### API Payload
`POST /api/credit-card-statements/sync`

```json
{
  "periodStart": "2026-05-01T00:00",
  "periodEnd": "2026-05-31T23:59"
}
```

### Behavior
- If `periodStart`/`periodEnd` are provided, sync is scoped to that window.
- If omitted, sync defaults to incremental behavior from latest known statement timestamp.
- Invalid ranges (`periodStart > periodEnd`) return `400`.

## 🔀 Method Selection Guide
| Situation | Recommended Method |
| --- | --- |
| Backend/API-driven recurring sync | 🛰️ Gmail API |
| Interactive operator run in live Gmail tab | 🧩 Playwright MCP |
| OAuth envs not ready yet | 🧩 Playwright MCP |
| Long-term deterministic automation | 🛰️ Gmail API |

## ✅ Data Consistency Contract
Both methods must preserve:
- same storage path (`data/credit-card-statements/raw/`)
- same manifest contract (`data/credit-card-statements/manifest.json`)
- same idempotency strategy (`messageId + attachmentId` hash key)
