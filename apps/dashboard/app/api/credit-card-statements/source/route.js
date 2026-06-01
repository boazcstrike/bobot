import fs from "fs";

import { getCreditCardStatementsPaths } from "lib/creditCardStatements";

export const runtime = "nodejs";
const REQUIRED_GMAIL_ENV_KEYS = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
  "GMAIL_REFRESH_TOKEN",
];

function isSet(value) {
  return Boolean(String(value || "").trim());
}

function asOptionalString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export async function GET() {
  try {
    const paths = getCreditCardStatementsPaths();
    const manifestExists = fs.existsSync(paths.manifestPath);
    const rawExists = fs.existsSync(paths.rawDir);
    const rawFileCount = rawExists ? fs.readdirSync(paths.rawDir).length : 0;
    const missingGmailEnv = REQUIRED_GMAIL_ENV_KEYS.filter((key) => !isSet(process.env[key]));

    return Response.json({
      ...paths,
      manifestExists,
      rawExists,
      rawFileCount,
      gmailConfig: {
        missingRequiredEnv: missingGmailEnv,
        source: asOptionalString(process.env.STATEMENTS_SYNC_SOURCE) || "gmail_api",
        targetEmail: asOptionalString(process.env.RCBC_GMAIL_TARGET_EMAIL),
        userId: asOptionalString(process.env.RCBC_GMAIL_USER_ID) || "me",
        query: asOptionalString(process.env.RCBC_GMAIL_QUERY),
        maxMessages: Number(process.env.RCBC_GMAIL_MAX_MESSAGES || 200),
        maxAttachments: Number(process.env.RCBC_GMAIL_MAX_ATTACHMENTS || 300),
      },
      playwrightConfig: {
        connectMode: asOptionalString(process.env.PLAYWRIGHT_GMAIL_CONNECT_MODE) || "persistent",
        accountIndex: asOptionalString(process.env.PLAYWRIGHT_GMAIL_ACCOUNT_INDEX) || "1",
        cdpEndpoint: asOptionalString(process.env.PLAYWRIGHT_GMAIL_CDP_ENDPOINT) || "chrome",
        headless: String(process.env.PLAYWRIGHT_GMAIL_HEADLESS || "false").trim(),
        userDataDir: asOptionalString(process.env.PLAYWRIGHT_GMAIL_USER_DATA_DIR),
        downloadDir: asOptionalString(process.env.PLAYWRIGHT_GMAIL_DOWNLOAD_DIR),
        browserChannel: asOptionalString(process.env.PLAYWRIGHT_GMAIL_BROWSER_CHANNEL) || "chrome",
        maxMessages: Number(process.env.PLAYWRIGHT_GMAIL_MAX_MESSAGES || 200),
        maxAttachments: Number(process.env.PLAYWRIGHT_GMAIL_MAX_ATTACHMENTS || 300),
        downloadTimeoutMs: Number(process.env.PLAYWRIGHT_GMAIL_DOWNLOAD_TIMEOUT_MS || 15000),
      },
    });
  } catch (error) {
    return new Response(`failed to inspect statements source: ${error.message}`, { status: 500 });
  }
}
