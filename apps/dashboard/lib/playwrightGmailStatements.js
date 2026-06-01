import fs from "fs";
import path from "path";

const DEFAULT_QUERY = 'from:(rcbc) ("statement of account" OR soa) has:attachment';
const DEFAULT_MAX_MESSAGES = 200;
const DEFAULT_MAX_ATTACHMENTS = 300;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 15000;
const ALLOWED_EXTENSIONS = [".pdf", ".csv"];
const CONNECT_MODE_PERSISTENT = "persistent";
const CONNECT_MODE_RUNNING_CHROME = "running_chrome";
const DEFAULT_RUNNING_CHROME_ENDPOINT = "chrome";
const DEFAULT_ACCOUNT_INDEX = "1";

function optionalEnv(name, fallback) {
  const value = String(process.env[name] || "").trim();
  return value || fallback;
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function toBoolean(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parseOptionalDate(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed);
}

function formatDateForGmailQuery(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function buildDateWindowQuery(baseQuery, { periodStart, periodEnd }) {
  const startDate = parseOptionalDate(periodStart);
  const endDate = parseOptionalDate(periodEnd);
  let query = String(baseQuery || "").trim() || DEFAULT_QUERY;

  if (startDate) {
    query += ` after:${formatDateForGmailQuery(startDate)}`;
  }

  if (endDate) {
    const endExclusive = new Date(endDate.getTime());
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    query += ` before:${formatDateForGmailQuery(endExclusive)}`;
  }

  return {
    query: query.trim(),
    periodStart: startDate ? startDate.toISOString() : null,
    periodEnd: endDate ? endDate.toISOString() : null,
  };
}

function resolveAccountIndex(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return DEFAULT_ACCOUNT_INDEX;
  // Gmail multi-login index is numeric (u/0, u/1, ...). Reject anything else.
  return /^\d+$/.test(normalized) ? normalized : DEFAULT_ACCOUNT_INDEX;
}

function buildGmailAccountUrl(accountIndex) {
  return `${GMAIL_BASE_URL}/u/${accountIndex}`;
}

function buildInboxUrl(accountIndex) {
  return `${buildGmailAccountUrl(accountIndex)}/#inbox`;
}

function buildSearchUrl(accountIndex, query) {
  return `${buildGmailAccountUrl(accountIndex)}/#search/${encodeURIComponent(query)}`;
}

// When no explicit window is requested, default to the current calendar year
// so "sync all" pulls every statement from this year, not the whole mailbox.
function applyDefaultYearWindow({ periodStart, periodEnd }) {
  if (periodStart || periodEnd) {
    return { periodStart: periodStart || null, periodEnd: periodEnd || null };
  }
  const year = new Date().getUTCFullYear();
  return {
    periodStart: `${year}-01-01T00:00:00.000Z`,
    periodEnd: `${year}-12-31T23:59:59.999Z`,
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function extensionAllowed(filename) {
  const lower = String(filename || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function createDirectories() {
  const baseDataDir = path.join(process.cwd(), ".data");
  const defaultUserDataDir = path.join(baseDataDir, "playwright-gmail-profile");
  const defaultDownloadDir = path.join(baseDataDir, "playwright-gmail-downloads");

  const userDataDir = optionalEnv("PLAYWRIGHT_GMAIL_USER_DATA_DIR", defaultUserDataDir);
  const downloadDir = optionalEnv("PLAYWRIGHT_GMAIL_DOWNLOAD_DIR", defaultDownloadDir);

  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(downloadDir, { recursive: true });

  return {
    userDataDir,
    downloadDir,
  };
}

function extractThreadIdFromUrl(url) {
  const value = String(url || "");
  const fromHash = value.match(/#(?:inbox|all|search|label)\/([A-Za-z0-9_-]+)/i);
  return fromHash?.[1] || "";
}

async function collectThreadUrls(page, maxMessages) {
  const urls = await page.evaluate(() => {
    const selectors = [
      "tr.zA a[href*='#']",
      "[role='main'] tr a[href*='#']",
      "[role='main'] a[href*='#']",
    ];
    const out = [];
    for (const selector of selectors) {
      for (const element of Array.from(document.querySelectorAll(selector))) {
        const href = element instanceof HTMLAnchorElement ? element.href : "";
        if (!href) continue;
        out.push(href);
      }
      if (out.length) break;
    }
    return out;
  });

  const deduped = [];
  const seenIds = new Set();
  for (const url of urls) {
    const threadId = extractThreadIdFromUrl(url);
    if (!threadId || seenIds.has(threadId)) continue;
    seenIds.add(threadId);
    deduped.push(url);
    if (deduped.length >= maxMessages) break;
  }

  return deduped;
}

async function resolveAuthenticatedEmail(page) {
  try {
    const content = await page.content();
    const matches = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    const gmail = matches.map(normalizeEmail).find((candidate) => candidate.endsWith("@gmail.com"));
    return gmail || "";
  } catch {
    return "";
  }
}

async function assertLoggedIn(page, targetEmail, options = {}) {
  const requireTargetMatch = options.requireTargetMatch === true;
  const url = page.url();
  if (url.includes("accounts.google.com")) {
    throw new Error(
      "Chrome is not authenticated in Gmail. Log in to Gmail in the Playwright profile and retry.",
    );
  }

  if (!targetEmail) {
    return "";
  }

  const authenticated = await resolveAuthenticatedEmail(page);
  if (requireTargetMatch && authenticated && authenticated !== targetEmail) {
    throw new Error(
      `Authenticated browser account (${authenticated}) does not match RCBC_GMAIL_TARGET_EMAIL (${targetEmail}).`,
    );
  }
  return authenticated || null;
}

async function extractMessageMetadata(page) {
  const metadata = await page.evaluate(() => {
    const subject =
      document.querySelector("h2.hP")?.textContent?.trim() ||
      document.querySelector("h2")?.textContent?.trim() ||
      "";
    const from =
      document.querySelector("span[email]")?.getAttribute("email")?.trim() ||
      document.querySelector("span.gD")?.getAttribute("email")?.trim() ||
      "";
    const emailDate =
      document.querySelector("time[datetime]")?.getAttribute("datetime")?.trim() ||
      "";
    return { subject, from, emailDate };
  });

  const parsedDate = Number.isFinite(Date.parse(metadata.emailDate))
    ? new Date(metadata.emailDate).toISOString()
    : new Date().toISOString();

  return {
    subject: metadata.subject || "",
    from: metadata.from || "",
    emailDate: parsedDate,
  };
}

async function navigateToInbox(page, accountIndex) {
  await page.goto(buildInboxUrl(accountIndex), {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_NAV_TIMEOUT_MS,
  });
  await page.waitForTimeout(2500);
}

async function navigateToGmailSearch(page, accountIndex, query) {
  await page.goto(buildSearchUrl(accountIndex, query), {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_NAV_TIMEOUT_MS,
  });
  await page.waitForTimeout(2500);
}

async function runGmailSearchInCurrentTab(page, query) {
  const searchInput = page.locator("input[name='q'], textarea[name='q']").first();
  await searchInput.waitFor({ state: "visible", timeout: 30000 });
  await searchInput.click({ timeout: 5000 });
  await searchInput.fill(query);
  await searchInput.press("Enter");
  await page.waitForTimeout(2500);
}

async function openThreadInCurrentTab(page, threadId) {
  const threadLink = page.locator(`a[href*='${threadId}']`).first();
  const count = await threadLink.count();
  if (!count) return false;
  await threadLink.click({ timeout: 7000 });
  await page.waitForTimeout(1000);
  return true;
}

async function returnToResultsInCurrentTab(page) {
  const backButton = page
    .locator("[aria-label='Back to Search results'], [aria-label='Back to Inbox'], [aria-label^='Back to']")
    .first();
  if (await backButton.isVisible().catch(() => false)) {
    await backButton.click({ timeout: 5000 }).catch(() => null);
  } else {
    await page.keyboard.press("u").catch(() => null);
  }
  await page.waitForTimeout(1200);
}

export async function fetchRcbcStatementAttachmentsViaPlaywright(options = {}) {
  const { chromium } = await import("playwright");
  const baseQuery = String(options.query || optionalEnv("RCBC_GMAIL_QUERY", DEFAULT_QUERY)).trim() || DEFAULT_QUERY;
  const requestedWindow = applyDefaultYearWindow({
    periodStart: options.periodStart || null,
    periodEnd: options.periodEnd || null,
  });
  const dateWindow = buildDateWindowQuery(baseQuery, requestedWindow);
  const accountIndex = resolveAccountIndex(
    optionalEnv("PLAYWRIGHT_GMAIL_ACCOUNT_INDEX", DEFAULT_ACCOUNT_INDEX),
  );
  const maxMessages = toPositiveInt(
    options.maxMessages ?? process.env.PLAYWRIGHT_GMAIL_MAX_MESSAGES,
    DEFAULT_MAX_MESSAGES,
  );
  const maxAttachments = toPositiveInt(
    options.maxAttachments ?? process.env.PLAYWRIGHT_GMAIL_MAX_ATTACHMENTS,
    DEFAULT_MAX_ATTACHMENTS,
  );
  const headless = toBoolean(process.env.PLAYWRIGHT_GMAIL_HEADLESS, false);
  const requireTargetMatch = toBoolean(process.env.PLAYWRIGHT_GMAIL_REQUIRE_TARGET_MATCH, false);
  const downloadTimeoutMs = toPositiveInt(
    process.env.PLAYWRIGHT_GMAIL_DOWNLOAD_TIMEOUT_MS,
    DEFAULT_DOWNLOAD_TIMEOUT_MS,
  );
  const targetEmail = normalizeEmail(optionalEnv("RCBC_GMAIL_TARGET_EMAIL", ""));
  const connectMode = optionalEnv("PLAYWRIGHT_GMAIL_CONNECT_MODE", CONNECT_MODE_PERSISTENT).toLowerCase();
  const { userDataDir, downloadDir } = createDirectories();
  const browserChannel = optionalEnv("PLAYWRIGHT_GMAIL_BROWSER_CHANNEL", "chrome");
  const configuredCdpEndpoint = optionalEnv(
    "PLAYWRIGHT_GMAIL_CDP_ENDPOINT",
    DEFAULT_RUNNING_CHROME_ENDPOINT,
  );

  let context = null;
  let page = null;
  let browser = null;
  let closeMode = CONNECT_MODE_PERSISTENT;
  let shouldClosePage = false;

  if (connectMode === CONNECT_MODE_RUNNING_CHROME) {
    const endpointsToTry = [];
    if (configuredCdpEndpoint) endpointsToTry.push(configuredCdpEndpoint);
    if (!endpointsToTry.includes(DEFAULT_RUNNING_CHROME_ENDPOINT)) {
      endpointsToTry.push(DEFAULT_RUNNING_CHROME_ENDPOINT);
    }

    let lastError = null;
    for (const endpoint of endpointsToTry) {
      try {
        browser = await chromium.connectOverCDP(endpoint, {
          timeout: 20000,
          noDefaults: true,
        });
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!browser) {
      throw new Error(
        `Unable to connect to running Chrome (${endpointsToTry.join(", ")}). Open chrome://inspect/#remote-debugging and enable "Allow remote debugging for this browser instance", then retry. ${lastError?.message || ""}`.trim(),
      );
    }
    context = browser.contexts()[0];
    if (!context) {
      throw new Error(
        "Connected to Chrome CDP but no browser context is available. Open at least one Chrome window and retry.",
      );
    }
    const existingPages = context.pages();
    page =
      existingPages.find((candidate) => String(candidate.url() || "").includes("mail.google.com")) ||
      existingPages[0] ||
      (await context.newPage());
    closeMode = CONNECT_MODE_RUNNING_CHROME;
  } else {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: browserChannel,
      headless,
      acceptDownloads: true,
      downloadsPath: downloadDir,
    });
    page = context.pages()[0] || (await context.newPage());
    shouldClosePage = true;
    closeMode = CONNECT_MODE_PERSISTENT;
  }

  const attachments = [];
  let messagesScanned = 0;
  let authenticatedEmail = null;

  try {
    await navigateToInbox(page, accountIndex);

    authenticatedEmail = await assertLoggedIn(page, targetEmail, { requireTargetMatch });

    await navigateToGmailSearch(page, accountIndex, dateWindow.query);
    let threadUrls = await collectThreadUrls(page, maxMessages);
    if (!threadUrls.length) {
      // URL-hash search can race Gmail's SPA; fall back to typing in the search box.
      await runGmailSearchInCurrentTab(page, dateWindow.query).catch(() => null);
      threadUrls = await collectThreadUrls(page, maxMessages);
    }

    for (const threadUrl of threadUrls) {
      if (attachments.length >= maxAttachments) break;

      const threadId = extractThreadIdFromUrl(threadUrl);
      if (!threadId) continue;
      const opened = await openThreadInCurrentTab(page, threadId);
      if (!opened) continue;
      messagesScanned += 1;

      const metadata = await extractMessageMetadata(page);
      const downloadButtons = page.locator("[aria-label^='Download'], [aria-label*='Download attachment']");
      const downloadCount = await downloadButtons.count();
      if (!downloadCount) {
        await returnToResultsInCurrentTab(page);
        continue;
      }

      let localAttachmentIndex = 0;

      for (let i = 0; i < downloadCount; i += 1) {
        if (attachments.length >= maxAttachments) break;

        const button = downloadButtons.nth(i);
        if (!(await button.isVisible().catch(() => false))) continue;

        try {
          const downloadPromise = page.waitForEvent("download", { timeout: downloadTimeoutMs });
          await button.click({ timeout: 5000 });
          const download = await downloadPromise;

          const suggestedFilename = download.suggestedFilename();
          if (!extensionAllowed(suggestedFilename)) {
            continue;
          }

          const tempSavePath = path.join(
            downloadDir,
            `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${suggestedFilename}`,
          );
          await download.saveAs(tempSavePath);
          const contentBuffer = fs.readFileSync(tempSavePath);
          fs.unlinkSync(tempSavePath);

          attachments.push({
            messageId: threadId || `thread-${messagesScanned}`,
            attachmentId: `ui-${localAttachmentIndex}-${suggestedFilename}`,
            emailDate: metadata.emailDate,
            subject: metadata.subject,
            from: metadata.from,
            filename: suggestedFilename,
            sizeBytes: contentBuffer.length,
            contentBuffer,
          });
          localAttachmentIndex += 1;
        } catch {
          // Download controls are dynamic in Gmail; skip non-downloadable nodes.
        }
      }

      await returnToResultsInCurrentTab(page);
    }

    attachments.sort((a, b) => Date.parse(b.emailDate) - Date.parse(a.emailDate));
    return {
      query: dateWindow.query,
      queryPeriod: {
        periodStart: dateWindow.periodStart,
        periodEnd: dateWindow.periodEnd,
      },
      gmailUserId: `browser-session-u/${accountIndex}`,
      targetEmail: targetEmail || null,
      authenticatedEmail,
      messagesScanned,
      attachments,
    };
  } catch (error) {
    throw new Error(`Playwright Gmail sync failed: ${error.message}`);
  } finally {
    if (shouldClosePage && page && !page.isClosed()) {
      await page.close().catch(() => null);
    }
    if (closeMode === CONNECT_MODE_RUNNING_CHROME) {
      if (browser) {
        await browser.close().catch(() => null);
      }
    } else if (context) {
      await context.close().catch(() => null);
    }
  }
}
