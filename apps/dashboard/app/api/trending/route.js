import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const GITHUB_REPOS_DIR = path.join(REPO_ROOT, "data", "github-repos");
const RESULT_LIMIT = 10;
const PERIODS = [
  { key: "daily", days: 1 },
  { key: "weekly", days: 7 },
  { key: "monthly", days: 30 },
];

function toLocalDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSnapshotDir(dateStamp) {
  return path.join(GITHUB_REPOS_DIR, dateStamp);
}

function buildSnapshotPath(dateStamp, name) {
  return path.join(buildSnapshotDir(dateStamp), `${name}.txt`);
}

function buildSnapshotFiles(dateStamp) {
  return [
    ...PERIODS.map((period) => buildSnapshotPath(dateStamp, period.key)),
    buildSnapshotPath(dateStamp, "meta"),
  ];
}

function ensureStorage() {
  fs.mkdirSync(GITHUB_REPOS_DIR, { recursive: true });
}

function loadSnapshot(dateStamp) {
  const snapshot = {};
  for (const period of PERIODS) {
    const filePath = buildSnapshotPath(dateStamp, period.key);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!Array.isArray(parsed)) {
        return null;
      }
      snapshot[period.key] = parsed;
    } catch {
      return null;
    }
  }

  let generatedAt = null;
  const metadataPath = buildSnapshotPath(dateStamp, "meta");
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      generatedAt = metadata?.generatedAt || null;
    } catch {
      generatedAt = null;
    }
  }

  if (!generatedAt) {
    generatedAt = new Date(fs.statSync(buildSnapshotDir(dateStamp)).mtimeMs).toISOString();
  }

  return { ...snapshot, generatedAt };
}

function saveSnapshot(dateStamp, payload) {
  const dirPath = buildSnapshotDir(dateStamp);
  fs.mkdirSync(dirPath, { recursive: true });

  for (const period of PERIODS) {
    const list = Array.isArray(payload[period.key]) ? payload[period.key] : [];
    fs.writeFileSync(buildSnapshotPath(dateStamp, period.key), JSON.stringify(list, null, 2));
  }

  fs.writeFileSync(
    buildSnapshotPath(dateStamp, "meta"),
    JSON.stringify({ generatedAt: payload.generatedAt }, null, 2),
  );
}

function getLatestSnapshotDate() {
  if (!fs.existsSync(GITHUB_REPOS_DIR)) {
    return null;
  }
  const snapshots = fs
    .readdirSync(GITHUB_REPOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  return snapshots[0] || null;
}

async function fetchTrendingForWindow(days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    q: `created:>${since}`,
    sort: "stars",
    order: "desc",
    per_page: String(RESULT_LIMIT),
  });

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "bobot-dashboard",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`github-trending-fetch-failed:${res.status}`);
  }

  const data = await res.json();
  return (data.items || []).map((repo) => ({
    id: repo.id,
    full_name: repo.full_name,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    description: repo.description || "",
  }));
}

export async function GET() {
  ensureStorage();
  const today = toLocalDateStamp();
  const currentSnapshot = loadSnapshot(today);

  if (currentSnapshot) {
    return Response.json({
      source: "cache",
      snapshotDate: today,
      outputLog: {
        status: "cache-hit",
        fetched: false,
        saved: false,
        storageFolder: buildSnapshotDir(today),
        calledTextFiles: buildSnapshotFiles(today),
      },
      ...currentSnapshot,
    });
  }

  try {
    const [daily, weekly, monthly] = await Promise.all(
      PERIODS.map((period) => fetchTrendingForWindow(period.days)),
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      daily,
      weekly,
      monthly,
    };

    saveSnapshot(today, payload);
    return Response.json({
      source: "live",
      snapshotDate: today,
      outputLog: {
        status: "fetched-live-and-saved",
        fetched: true,
        saved: true,
        storageFolder: buildSnapshotDir(today),
        calledTextFiles: buildSnapshotFiles(today),
      },
      ...payload,
    });
  } catch {
    const latestDate = getLatestSnapshotDate();
    if (latestDate) {
      const staleSnapshot = loadSnapshot(latestDate);
      if (staleSnapshot) {
        return Response.json({
          source: "stale-cache",
          snapshotDate: latestDate,
          stale: true,
          outputLog: {
            status: "fetch-failed-using-stale-cache",
            fetched: false,
            saved: false,
            storageFolder: buildSnapshotDir(latestDate),
            calledTextFiles: buildSnapshotFiles(latestDate),
          },
          ...staleSnapshot,
        });
      }
    }

    return Response.json(
      {
        error: "failed to fetch trending repositories",
        outputLog: {
          status: "fetch-failed-no-cache",
          fetched: false,
          saved: false,
          storageFolder: buildSnapshotDir(today),
          calledTextFiles: buildSnapshotFiles(today),
        },
      },
      { status: 502 },
    );
  }
}
