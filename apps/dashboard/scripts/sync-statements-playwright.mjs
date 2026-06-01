import fs from "fs";
import path from "path";

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

function parseArgs(argv) {
  const args = new Set(argv.slice(2).map((value) => String(value || "").trim()));
  return {
    fullScan: args.has("--full-scan"),
  };
}

async function run() {
  loadLocalEnv();
  const { fullScan } = parseArgs(process.argv);
  const port = String(process.env.DASHBOARD_PORT || "3010").trim() || "3010";
  const endpoint = `http://localhost:${port}/api/credit-card-statements/sync`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "playwright_chrome",
      fullScan,
    }),
  }).catch((error) => {
    throw new Error(
      `Failed to reach ${endpoint}. Start the dashboard first with 'npm run dev'. ${error.message}`,
    );
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Sync failed with status ${response.status}`;
    throw new Error(message);
  }

  console.log(JSON.stringify(payload, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
