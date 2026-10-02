# Bobot Backlog

## 2026-10-02: RCBC credit card statements sync moved to bo-life

1. **Ported.** RCBC statements + Gmail sync were ported to `C:\Users\boazs\webdev\bo-life`. Statements live at `bo-life\finance\statements\rcbc-credit-card`; the script is `bo-life\tools\rcbc-sync.mjs` (being built 2026-10-02).
2. **Superseded in bobot.** The `apps/dashboard` credit-card-statements feature is now superseded: retire it, or repoint the `STATEMENTS` paths to bo-life. It covers:
   - `lib/gmailStatements.js`
   - `lib/playwrightGmailStatements.js`
   - `lib/creditCardStatements.js`
   - route `/api/credit-card-statements/sync`
   - page `/credit-card-statements`
   - `scripts/sync-statements-playwright.mjs`
3. **Cleanup after retiring.** Delete the empty `data/credit-card-statements/raw` and `manifest.json`. `creditCardStatements.js` recreates `raw` via `mkdirSync`, so remove the code first.
4. **Env keys.** bobot `.env` still holds `GMAIL_*` and `PLAYWRIGHT_GMAIL_*` keys, used by the port via `BOBOT_ENV_FILE`. Move them to the bo-life env when retiring (never print values).
5. **PDF password.** Statement PDFs are password protected. Supply the password via env var at run time; never store it.
6. **Scheduling.** bobot is not scheduled for statements; scheduling lives in bo-life.
