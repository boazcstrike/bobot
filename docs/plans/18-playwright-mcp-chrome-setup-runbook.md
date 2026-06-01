# Playwright MCP + Chrome Setup Runbook

## Goal
Get a working Chrome-connected Playwright MCP path for Bobot operations, then use it as an alternative statement-sync execution channel.

## Prerequisites
- Node.js 18+ installed.
- Chrome installed on your machine.
- MCP client configured locally (the client you use with this repo).

## Path A: Extension Mode (Primary)
1. Install the Playwright browser extension in Chrome.
2. In your MCP client config, add a Playwright server using:
   - `command`: `npx`
   - `args`: `["@playwright/mcp@latest", "--extension"]`
3. Restart the MCP client.
4. Open Chrome and make sure your Gmail session for `boaz.sze@gmail.com` is already authenticated.
5. Run a smoke prompt: open Gmail inbox and list latest RCBC statement emails.

Repo template:
- `tools/playwright-mcp/mcp.playwright.extension.example.json`

## Path B: CDP Channel Mode (Fallback)
1. In Chrome, open `chrome://inspect/#remote-debugging`.
2. Enable remote debugging for this browser instance.
3. In MCP client config, use:
   - `command`: `npx`
   - `args`: `["@playwright/mcp@latest", "--cdp-endpoint=chrome"]`
4. Restart the MCP client and retry smoke prompt.

Repo template:
- `tools/playwright-mcp/mcp.playwright.cdp.example.json`

## Operational Checks
1. Connection check:
   - MCP tool list contains Playwright tools.
2. Session check:
   - Gmail opens without login prompt for `boaz.sze@gmail.com`.
3. Data check:
   - agent can identify newest RCBC statement messages.

## Known Failure Modes
- Extension installed but MCP server launched without `--extension`.
- MCP server starts but cannot find browser channel in CDP mode.
- Gmail not authenticated in target profile.
- Browser policy/security tools block extension communication.

## Next Bootstrap Step (After Setup Passes)
Implement a repo command/script that:
1. reads statement rows via Playwright MCP run
2. writes attachments to `data/credit-card-statements/raw/`
3. upserts `data/credit-card-statements/manifest.json`
4. preserves current idempotency (`messageId + attachmentId` key behavior)
