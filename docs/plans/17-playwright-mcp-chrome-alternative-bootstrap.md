# Playwright MCP + Chrome Alternative Bootstrap Plan

## Why This Exists
Current Gmail API sync is blocked by missing OAuth credentials and token provisioning. This plan adds an alternative automation path using Playwright MCP connected to your existing Chrome profile/session.

## Objective
Use Chrome-backed Playwright MCP to automate statement retrieval and ingestion without depending on Gmail API OAuth setup as the first path.

## Information Reference
For the official two-method sync documentation (Gmail API + Playwright MCP with 5.4-mini), see:
- `docs/plans/19-credit-card-statements-sync-methods-information-2026-05-31.md`

## Alternative Modes
1. Extension mode (recommended first): connect to existing browser tabs and state.
2. CDP mode (fallback): connect via Chrome remote debugging channel.

Bootstrap templates created in this repo:
- `tools/playwright-mcp/mcp.playwright.extension.example.json`
- `tools/playwright-mcp/mcp.playwright.cdp.example.json`

## Constraints
- I cannot install/manage your local Chrome extension from this runtime.
- You must complete local browser installation and MCP-client wiring.
- This flow reuses your logged-in browser state; secure your local profile/session.

## Execution Plan
1. Install and wire extension mode locally.
Evaluator Verification: MCP client lists Playwright server and can attach to an existing Chrome tab.

2. Validate browser-driven Gmail navigation.
Evaluator Verification: agent can open Gmail inbox and list RCBC statement emails from newest to oldest.

3. Implement ingestion bridge command in this repo (next step after connection is verified).
Evaluator Verification: one command pulls metadata/attachments and writes into `data/credit-card-statements/manifest.json` with idempotency.

4. Add fallback routing in dashboard sync endpoint.
Evaluator Verification: `POST /api/credit-card-statements/sync` supports mode selection (`gmail_api` vs `playwright_chrome`) and returns clear telemetry.

## Initial Success Criteria
- Playwright MCP is connected to your Chrome session.
- Agent can operate Gmail UI in your existing authenticated account.
- We can run a repeatable, repo-documented flow for statement sync without re-authoring the process each session.

## Risks
- Gmail UI changes can break selectors.
- Browser session expiry/2FA can interrupt runs.
- Extension/bridge version mismatch can block connection.

## Mitigations
- Keep selectors role/text-based where possible and validate on every run.
- Add preflight check (logged-in mailbox identity and inbox readiness).
- Keep CDP config as immediate fallback if extension bridge fails.
