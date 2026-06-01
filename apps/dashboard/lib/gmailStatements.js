import { google } from "googleapis";

const DEFAULT_QUERY = 'from:(rcbc) ("statement of account" OR soa) has:attachment';
const DEFAULT_MAX_MESSAGES = 200;
const DEFAULT_MAX_ATTACHMENTS = 300;
const ALLOWED_EXTENSIONS = [".pdf", ".csv"];
const DEFAULT_GMAIL_USER_ID = "me";
const REQUIRED_GMAIL_ENV_KEYS = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
  "GMAIL_REFRESH_TOKEN",
];

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  const value = String(process.env[name] || "").trim();
  return value || fallback;
}

function listMissingRequiredEnvVars() {
  return REQUIRED_GMAIL_ENV_KEYS.filter((name) => !String(process.env[name] || "").trim());
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseOptionalDate(value) {
  if (!value) return null;
  const asDate = new Date(value);
  if (!Number.isFinite(asDate.getTime())) return null;
  return asDate;
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

function decodeBase64Url(data) {
  const normalized = String(data || "").replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

function findHeader(headers, targetName) {
  const header = (headers || []).find((entry) => String(entry.name || "").toLowerCase() === targetName.toLowerCase());
  return header?.value || "";
}

function parseMessageDate(messageData) {
  const internalDateMs = Number(messageData?.internalDate || 0);
  if (Number.isFinite(internalDateMs) && internalDateMs > 0) {
    return new Date(internalDateMs).toISOString();
  }

  const dateHeader = findHeader(messageData?.payload?.headers, "date");
  const parsedDate = Date.parse(dateHeader);
  if (Number.isFinite(parsedDate)) {
    return new Date(parsedDate).toISOString();
  }

  return new Date().toISOString();
}

function flattenMimeParts(part, out = []) {
  if (!part) return out;
  out.push(part);
  if (Array.isArray(part.parts)) {
    part.parts.forEach((child) => flattenMimeParts(child, out));
  }
  return out;
}

function isAllowedAttachment(filename) {
  const lower = String(filename || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatGmailApiError(error) {
  const status = Number(error?.response?.status || error?.code || 0) || null;
  const apiMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.error_description ||
    error?.message ||
    "Unknown Gmail API error";

  if (status === 401 || status === 403) {
    return `Gmail API auth failed (${status}): ${apiMessage}. Check OAuth consent, scopes, and refresh token for RCBC_GMAIL_TARGET_EMAIL.`;
  }

  if (status) {
    return `Gmail API request failed (${status}): ${apiMessage}`;
  }

  return `Gmail API request failed: ${apiMessage}`;
}

function createGmailClient() {
  const missing = listMissingRequiredEnvVars();
  if (missing.length) {
    throw new Error(
      `Missing Gmail config: ${missing.join(", ")}. Set these env vars in apps/dashboard/.env before syncing.`,
    );
  }

  const clientId = requiredEnv("GMAIL_CLIENT_ID");
  const clientSecret = requiredEnv("GMAIL_CLIENT_SECRET");
  const redirectUri = requiredEnv("GMAIL_REDIRECT_URI");
  const refreshToken = requiredEnv("GMAIL_REFRESH_TOKEN");
  const gmailUserId = optionalEnv("RCBC_GMAIL_USER_ID", DEFAULT_GMAIL_USER_ID);
  const targetEmail = normalizeEmail(optionalEnv("RCBC_GMAIL_TARGET_EMAIL", ""));

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });

  return {
    gmail: google.gmail({ version: "v1", auth }),
    gmailUserId,
    targetEmail,
  };
}

async function resolveAuthenticatedEmail(gmail) {
  const profileResponse = await gmail.users.getProfile({ userId: "me" });
  return normalizeEmail(profileResponse.data?.emailAddress || "");
}

async function assertTargetEmailMatch(gmail, targetEmail) {
  if (!targetEmail) {
    return "";
  }

  const authenticatedEmail = await resolveAuthenticatedEmail(gmail);
  if (!authenticatedEmail) {
    throw new Error("Unable to resolve authenticated Gmail profile email.");
  }

  if (authenticatedEmail !== targetEmail) {
    throw new Error(
      `Authenticated Gmail account (${authenticatedEmail}) does not match RCBC_GMAIL_TARGET_EMAIL (${targetEmail}). Update token or config.`,
    );
  }

  return authenticatedEmail;
}

async function listMessageIdsNewestFirst(gmail, userId, query, maxMessages) {
  const messageIds = [];
  let pageToken = undefined;

  while (messageIds.length < maxMessages) {
    const response = await gmail.users.messages.list({
      userId,
      q: query,
      maxResults: Math.min(100, maxMessages - messageIds.length),
      pageToken,
    });

    const messages = response.data.messages || [];
    messages.forEach((msg) => {
      if (msg?.id) {
        messageIds.push(msg.id);
      }
    });

    pageToken = response.data.nextPageToken || undefined;
    if (!pageToken || !messages.length) {
      break;
    }
  }

  return messageIds;
}

export async function fetchRcbcStatementAttachments(options = {}) {
  try {
    const { gmail, gmailUserId, targetEmail } = createGmailClient();
    const baseQuery = String(options.query || optionalEnv("RCBC_GMAIL_QUERY", DEFAULT_QUERY)).trim() || DEFAULT_QUERY;
    const dateWindow = buildDateWindowQuery(baseQuery, {
      periodStart: options.periodStart || null,
      periodEnd: options.periodEnd || null,
    });
    const maxMessages = toPositiveInt(
      options.maxMessages ?? process.env.RCBC_GMAIL_MAX_MESSAGES,
      DEFAULT_MAX_MESSAGES,
    );
    const maxAttachments = toPositiveInt(
      options.maxAttachments ?? process.env.RCBC_GMAIL_MAX_ATTACHMENTS,
      DEFAULT_MAX_ATTACHMENTS,
    );

    const authenticatedEmail = await assertTargetEmailMatch(gmail, targetEmail);
    const messageIds = await listMessageIdsNewestFirst(gmail, gmailUserId, dateWindow.query, maxMessages);
    const attachments = [];

    for (const messageId of messageIds) {
      if (attachments.length >= maxAttachments) break;

      const messageResponse = await gmail.users.messages.get({
        userId: gmailUserId,
        id: messageId,
        format: "full",
      });

      const messageData = messageResponse.data;
      const payload = messageData?.payload;
      if (!payload) continue;

      const parts = flattenMimeParts(payload);
      const emailDate = parseMessageDate(messageData);
      const subject = findHeader(payload.headers, "subject");
      const from = findHeader(payload.headers, "from");

      for (const part of parts) {
        if (attachments.length >= maxAttachments) break;

        const filename = String(part?.filename || "").trim();
        if (!filename || !isAllowedAttachment(filename)) continue;

        const attachmentId = part?.body?.attachmentId;
        let contentBuffer = null;

        if (attachmentId) {
          const attachmentResponse = await gmail.users.messages.attachments.get({
            userId: gmailUserId,
            messageId,
            id: attachmentId,
          });
          contentBuffer = decodeBase64Url(attachmentResponse.data?.data);
        } else if (part?.body?.data) {
          contentBuffer = decodeBase64Url(part.body.data);
        }

        if (!contentBuffer || !contentBuffer.length) continue;

        attachments.push({
          messageId,
          attachmentId: attachmentId || `inline-${filename}`,
          emailDate,
          subject,
          from,
          filename,
          sizeBytes: contentBuffer.length,
          contentBuffer,
        });
      }
    }

    attachments.sort((a, b) => Date.parse(b.emailDate) - Date.parse(a.emailDate));
    return {
      query: dateWindow.query,
      queryPeriod: {
        periodStart: dateWindow.periodStart,
        periodEnd: dateWindow.periodEnd,
      },
      gmailUserId,
      targetEmail: targetEmail || null,
      authenticatedEmail: authenticatedEmail || null,
      messagesScanned: messageIds.length,
      attachments,
    };
  } catch (error) {
    const message = String(error?.message || "");
    if (
      message.includes("Missing Gmail config:") ||
      message.includes("does not match RCBC_GMAIL_TARGET_EMAIL") ||
      message.includes("is required")
    ) {
      throw error;
    }
    throw new Error(formatGmailApiError(error));
  }
}
