import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getGitActivity, isGitRepo } from "./gitActivity.js";

const DEFAULT_REPO = "boazcstrike/boazcstrike";
const DEFAULT_FILE = "github-repos.md";
const execFileAsync = promisify(execFile);

// UI-editable override for the local notes checkout, persisted at the repo root
// so it survives restarts. Falls back to the GITHUB_NOTES_LOCAL_REPO env var.
const CONFIG_PATH = path.join(process.cwd(), "..", "..", "data", "personal-github-config.json");

function readStoredLocalPath() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return typeof parsed?.localPath === "string" ? parsed.localPath.trim() : "";
  } catch {
    return "";
  }
}

function writeStoredLocalPath(localPath) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify({ localPath }, null, 2)}\n`, "utf8");
}

function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

export function getPersonalGithubTarget() {
  const storedLocalPath = readStoredLocalPath();
  const envLocalPath = (process.env.GITHUB_NOTES_LOCAL_REPO || "").trim();
  const localPath = storedLocalPath || envLocalPath;
  const filePath = process.env.GITHUB_NOTES_FILE || DEFAULT_FILE;
  const useLocal = Boolean(localPath && fs.existsSync(path.join(localPath, filePath)));

  return {
    repository: process.env.GITHUB_NOTES_REPO || DEFAULT_REPO,
    path: filePath,
    branch: process.env.GITHUB_NOTES_BRANCH || "",
    localPath: useLocal ? localPath : "",
    // Surfaced so the UI can show/edit the configured path even when the file
    // is missing or the checkout is unavailable.
    configuredLocalPath: localPath,
    localPathSource: storedLocalPath ? "config" : envLocalPath ? "env" : "none",
    mode: useLocal ? "local" : "github",
  };
}

export async function getNotesRepoActivity() {
  const target = getPersonalGithubTarget();
  if (target.mode !== "local") return null;
  return getGitActivity(target.localPath);
}

export async function setNotesRepoLocalPath(inputPath) {
  const value = String(inputPath || "").trim();
  if (!value) {
    writeStoredLocalPath("");
    return { localPath: "" };
  }

  const resolved = path.resolve(value);
  const stat = fs.existsSync(resolved) ? fs.statSync(resolved) : null;
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Path does not exist or is not a directory: ${resolved}`);
  }
  if (!(await isGitRepo(resolved))) {
    throw new Error(`Not a git repository: ${resolved}`);
  }

  writeStoredLocalPath(resolved);
  return { localPath: resolved };
}

function buildHeaders({ write = false } = {}) {
  const token = getGitHubToken();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "bobot-dashboard",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (write) {
    throw new Error("GITHUB_TOKEN or GH_TOKEN is required to commit changes.");
  }

  return headers;
}

function encodePath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function buildContentsUrl(target) {
  const url = new URL(
    `https://api.github.com/repos/${target.repository}/contents/${encodePath(target.path)}`,
  );
  if (target.branch) {
    url.searchParams.set("ref", target.branch);
  }
  return url;
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function buildLocalFilePath(target) {
  if (!target.localPath) {
    throw new Error("GITHUB_NOTES_LOCAL_REPO is not configured.");
  }

  const resolvedRoot = path.resolve(target.localPath);
  const resolvedFile = path.resolve(resolvedRoot, target.path);
  const relative = path.relative(resolvedRoot, resolvedFile);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("GITHUB_NOTES_FILE must stay inside GITHUB_NOTES_LOCAL_REPO.");
  }

  return resolvedFile;
}

async function getLocalBranch(target) {
  try {
    const { stdout } = await execFileAsync("git", ["branch", "--show-current"], {
      cwd: target.localPath,
      windowsHide: true,
    });
    return stdout.trim();
  } catch {
    return "";
  }
}

export async function pullPersonalGithubRepo() {
  const target = getPersonalGithubTarget();
  if (target.mode !== "local") {
    throw new Error("Pull is only available when GITHUB_NOTES_LOCAL_REPO points to a local checkout.");
  }

  const { stdout, stderr } = await execFileAsync("git", ["pull", "--ff-only"], {
    cwd: target.localPath,
    windowsHide: true,
  });

  return {
    target,
    output: `${stdout || ""}${stderr || ""}`.trim(),
  };
}

function parseGithubRepoUrl(input) {
  const value = String(input || "").trim();
  if (!value) return null;

  let owner = "";
  let repo = "";

  const urlMatch = value.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
  if (urlMatch) {
    owner = urlMatch[1];
    repo = urlMatch[2];
  } else {
    const shorthand = value.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (!shorthand) return null;
    owner = shorthand[1];
    repo = shorthand[2];
  }

  repo = repo.replace(/\.git$/i, "").replace(/\/$/, "");
  if (!owner || !repo) return null;

  return { owner, repo };
}

const README_SUMMARY_MAX = 200;

function extractReadmeSummary(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue; // heading
    if (/^[-*+]\s/.test(line)) continue; // list item
    if (/^>/.test(line)) continue; // blockquote
    if (/^<!--/.test(line)) continue; // html comment
    if (/^<\/?[a-z]/i.test(line)) continue; // html tag line

    // Drop image / badge-only lines (e.g. [![badge](img)](link)).
    const withoutImages = line
      .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .trim();
    if (!withoutImages) continue;

    const clean = withoutImages
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // markdown links -> text
      .replace(/[*_`]+/g, "") // emphasis / inline code markers
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) continue;

    const firstSentence = clean.split(/(?<=[.!?])\s/)[0] || clean;
    return firstSentence.length > README_SUMMARY_MAX
      ? `${clean.slice(0, README_SUMMARY_MAX).trim()}…`
      : firstSentence;
  }

  return "";
}

async function fetchGithubReadmeSummary(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { ...buildHeaders(), Accept: "application/vnd.github.raw" },
      cache: "no-store",
    });
    if (!res.ok) return "";
    return extractReadmeSummary(await res.text());
  } catch {
    return "";
  }
}

export async function fetchGithubRepoMetadata(repoUrl) {
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error("Enter a valid GitHub repository URL (https://github.com/owner/repo).");
  }

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new Error(`Repository not found: ${parsed.owner}/${parsed.repo}`);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch repository metadata: ${res.status}`);
  }

  const payload = await res.json();

  // GitHub "description" is often null; fall back to the README's first line
  // so the markdown entry matches the existing "- [name](url) - summary" pattern.
  let description = (payload.description || "").trim();
  if (!description) {
    description = await fetchGithubReadmeSummary(parsed.owner, parsed.repo);
  }

  return {
    name: payload.name || parsed.repo,
    full_name: payload.full_name || `${parsed.owner}/${parsed.repo}`,
    description,
    html_url: payload.html_url || `https://github.com/${parsed.owner}/${parsed.repo}`,
    stargazers_count: payload.stargazers_count || 0,
  };
}

export async function fetchPersonalGithubMarkdown() {
  const target = getPersonalGithubTarget();
  if (target.mode === "local") {
    const localFilePath = buildLocalFilePath(target);
    const content = fs.readFileSync(localFilePath, "utf8");
    const branch = await getLocalBranch(target);

    return {
      target: { ...target, branch },
      sha: hashContent(content),
      content,
      htmlUrl: `https://github.com/${target.repository}/blob/${branch || target.branch || "main"}/${target.path}`,
    };
  }

  const res = await fetch(buildContentsUrl(target), {
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`failed to fetch ${target.repository}/${target.path}: ${res.status}`);
  }

  const payload = await res.json();
  const content = Buffer.from(payload.content || "", "base64").toString("utf8");

  return {
    target,
    sha: payload.sha,
    content,
    htmlUrl: payload.html_url,
  };
}

export async function updatePersonalGithubMarkdown({ content, sha, message }) {
  const target = getPersonalGithubTarget();
  if (target.mode === "local") {
    const localFilePath = buildLocalFilePath(target);
    const currentContent = fs.readFileSync(localFilePath, "utf8");
    if (sha && hashContent(currentContent) !== sha) {
      throw new Error("Local github-repos.md changed. Reload before committing.");
    }

    const newline = currentContent.includes("\r\n") ? "\r\n" : "\n";
    const normalizedContent = content.replace(/\r?\n/g, newline);
    fs.writeFileSync(localFilePath, normalizedContent, "utf8");
    await execFileAsync("git", ["add", "--", target.path], {
      cwd: target.localPath,
      windowsHide: true,
    });

    const commitMessage = message || `chore: update ${target.path}`;
    await execFileAsync("git", ["commit", "-m", commitMessage, "--", target.path], {
      cwd: target.localPath,
      windowsHide: true,
    });

    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: target.localPath,
      windowsHide: true,
    });
    const nextContent = fs.readFileSync(localFilePath, "utf8");

    return {
      commitSha: stdout.trim(),
      contentSha: hashContent(nextContent),
      htmlUrl: `https://github.com/${target.repository}/blob/${target.branch || "main"}/${target.path}`,
    };
  }

  const body = {
    message: message || `chore: update ${target.path}`,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
  };

  if (target.branch) {
    body.branch = target.branch;
  }

  const res = await fetch(buildContentsUrl(target), {
    method: "PUT",
    headers: {
      ...buildHeaders({ write: true }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.message || `failed to commit ${target.path}: ${res.status}`);
  }

  return {
    commitSha: payload?.commit?.sha || null,
    contentSha: payload?.content?.sha || null,
    htmlUrl: payload?.content?.html_url || null,
  };
}

function normalizeHeadingTitle(title) {
  return title.replace(/\s+/g, " ").trim();
}

function parseRepoLine(line) {
  const match = line.match(/^\s*-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+-\s*(.*))?\s*$/);
  if (!match) return null;

  return {
    name: match[1].trim(),
    url: match[2].trim(),
    description: (match[3] || "").trim(),
  };
}

function renderRepoLine(item) {
  const description = (item.description || "").trim();
  return description
    ? `- [${item.name}](${item.url}) - ${description}`
    : `- [${item.name}](${item.url})`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseGithubReposMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const headings = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) return;

    headings.push({
      id: `${index}-${slugify(match[2]) || "section"}`,
      title: normalizeHeadingTitle(match[2]),
      level: match[1].length,
      lineIndex: index,
      items: [],
    });
  });

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const start = heading.lineIndex + 1;
    const end = nextHeading ? nextHeading.lineIndex : lines.length;

    for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
      const item = parseRepoLine(lines[lineIndex]);
      if (item) {
        heading.items.push({
          ...item,
          id: `${heading.id}-${lineIndex}-${slugify(item.name) || "repo"}`,
        });
      }
    }
  });

  return headings.filter((heading, index) => index > 0);
}

export function renderGithubReposMarkdown(content, updatedCategories) {
  const lines = content.split(/\r?\n/);
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const headings = parseGithubReposMarkdown(content);
  const categoryById = new Map(updatedCategories.map((category) => [category.id, category]));

  for (let index = headings.length - 1; index >= 0; index -= 1) {
    const heading = headings[index];
    const update = categoryById.get(heading.id);
    if (!update) continue;

    const nextHeading = headings.find(
      (candidate) => candidate.lineIndex > heading.lineIndex,
    );
    const start = heading.lineIndex + 1;
    const end = nextHeading ? nextHeading.lineIndex : lines.length;
    const repoLineIndexes = [];

    for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
      if (parseRepoLine(lines[lineIndex])) {
        repoLineIndexes.push(lineIndex);
      }
    }

    const rendered = (update.items || []).map(renderRepoLine);

    if (repoLineIndexes.length) {
      const replaceStart = repoLineIndexes[0];
      const replaceEnd = repoLineIndexes[repoLineIndexes.length - 1] + 1;
      lines.splice(replaceStart, replaceEnd - replaceStart, ...rendered);
      continue;
    }

    const insertAt = start;
    const insertLines = rendered.length ? ["", ...rendered] : [];
    lines.splice(insertAt, 0, ...insertLines);
  }

  return lines.join(newline).replace(/\s+$/, newline);
}

export function flattenRepoItems(categories) {
  return categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryId: category.id,
      categoryTitle: category.title,
    })),
  );
}

export function suggestCategoryId(categories, repo) {
  const haystack = `${repo.full_name || repo.name || ""} ${repo.description || ""}`.toLowerCase();
  const rules = [
    { terms: ["agent", "llm", "ai", "claude", "codex", "gpt"], names: ["Automation & Agents", "AI"] },
    { terms: ["dashboard", "admin", "crm", "analytics"], names: ["Dashboards"] },
    { terms: ["security", "osint", "scanner", "secret", "pentest"], names: ["Security"] },
    { terms: ["readme", "profile"], names: ["GitHub & Profile"] },
    { terms: ["awesome", "curated", "list"], names: ["Curated Lists & Awesome Repositories"] },
    { terms: ["course", "learn", "book", "interview"], names: ["Learning & Skill Improvement"] },
    { terms: ["crawler", "scrape", "data"], names: ["Crawlers", "Web & Data"] },
    { terms: ["tool", "cli", "terminal"], names: ["Dev Tools", "Mini Tools"] },
  ];

  for (const rule of rules) {
    if (!rule.terms.some((term) => haystack.includes(term))) continue;
    const match = categories.find((category) =>
      rule.names.some((name) => category.title.toLowerCase().includes(name.toLowerCase())),
    );
    if (match) return match.id;
  }

  return categories.find((category) => category.title === "General")?.id || categories[0]?.id || "";
}
