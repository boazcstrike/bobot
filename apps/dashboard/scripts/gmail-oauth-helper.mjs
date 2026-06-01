import fs from "fs";
import path from "path";
import process from "process";
import { google } from "googleapis";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function createOAuthClient() {
  loadLocalEnv();
  const clientId = requiredEnv("GMAIL_CLIENT_ID");
  const clientSecret = requiredEnv("GMAIL_CLIENT_SECRET");
  const redirectUri = requiredEnv("GMAIL_REDIRECT_URI");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function run() {
  const mode = String(process.argv[2] || "").trim().toLowerCase();
  const client = createOAuthClient();

  if (mode === "url") {
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [GMAIL_SCOPE],
    });
    console.log(authUrl);
    return;
  }

  if (mode === "token") {
    const code = String(process.argv[3] || "").trim();
    if (!code) {
      throw new Error("Authorization code is required: npm run gmail:exchange-code -- \"<code>\"");
    }
    const { tokens } = await client.getToken(code);
    if (!tokens?.refresh_token) {
      throw new Error(
        "No refresh token returned. Re-authorize with prompt=consent and ensure offline access is enabled.",
      );
    }
    console.log(tokens.refresh_token);
    return;
  }

  throw new Error("Usage: npm run gmail:auth-url OR npm run gmail:exchange-code -- \"<code>\"");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
