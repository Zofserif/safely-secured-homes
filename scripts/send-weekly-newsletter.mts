import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILES = [".env.local", ".env"];

const loadEnvFiles = () => {
  for (const envFile of ENV_FILES) {
    const fullPath = path.resolve(process.cwd(), envFile);
    if (!existsSync(fullPath)) continue;

    const fileContents = readFileSync(fullPath, "utf8");
    for (const rawLine of fileContents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const normalizedLine = line.startsWith("export ")
        ? line.slice("export ".length)
        : line;
      const separatorIndex = normalizedLine.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = normalizedLine.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = normalizedLine.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value.replace(/\\n/g, "\n");
    }
  }
};

const readFlag = (flagName: string): string | null => {
  const flagPrefix = `--${flagName}=`;
  const directValue = process.argv.find((arg) => arg.startsWith(flagPrefix));
  if (directValue) {
    return directValue.slice(flagPrefix.length).trim() || null;
  }

  const flagIndex = process.argv.findIndex((arg) => arg === `--${flagName}`);
  if (flagIndex === -1) return null;

  const nextArg = process.argv[flagIndex + 1];
  if (!nextArg || nextArg.startsWith("--")) return null;
  return nextArg.trim() || null;
};

const parsePositiveInteger = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatUtcDateKey = (input: string | null) => {
  const resolvedDate = input ? new Date(`${input}T00:00:00Z`) : new Date();
  if (!Number.isFinite(resolvedDate.getTime())) {
    throw new Error(
      `Invalid --date value "${input}". Use YYYY-MM-DD, for example 2026-03-12.`,
    );
  }

  const year = resolvedDate.getUTCFullYear();
  const month = `${resolvedDate.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${resolvedDate.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

loadEnvFiles();

const slug = readFlag("slug");
if (!slug) {
  throw new Error("Missing --slug. Example: --slug camera-placement-mistakes-families-make");
}

const limit = parsePositiveInteger(readFlag("limit"));
const sendDateKey = formatUtcDateKey(readFlag("date"));
const sendKey = `weekly_${sendDateKey}_${slug}`;

const { getBlogPostBySlug } = await import("../app/lib/blogPosts");
const { listSubscribedNewsletterRecipients } = await import(
  "../app/lib/newsletterCampaigns"
);
const {
  EMAIL_SENDING_DISABLED_ERROR,
} = await import("../app/lib/siteAdminSettings");
const { getPublicSiteSettings } = await import(
  "../app/lib/siteAdminSettingsServer"
);
const { sendTrackedBroadcastNewsletterEmailByPostId } = await import(
  "../app/lib/newsletterCampaignEmail"
);

const post = await getBlogPostBySlug(slug);
if (!post) {
  throw new Error(`Blog post "${slug}" was not found.`);
}

const siteSettings = await getPublicSiteSettings();
if (!siteSettings.emailSendingEnabled) {
  throw new Error(EMAIL_SENDING_DISABLED_ERROR);
}

const recipients = await listSubscribedNewsletterRecipients({ limit: limit ?? undefined });
if (recipients.length === 0) {
  console.log("No subscribed recipients found.");
  process.exit(0);
}

let sentCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (const recipient of recipients) {
  try {
    const result = await sendTrackedBroadcastNewsletterEmailByPostId({
      sendKey,
      subscriberId: recipient.subscriberId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      postId: post.id,
    });

    if (result.skipped) {
      skippedCount += 1;
      continue;
    }

    sentCount += 1;
  } catch (error) {
    failedCount += 1;
    console.error(
      `Failed to send "${sendKey}" to ${recipient.email}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

console.log(`Send key: ${sendKey}`);
console.log(`Post: ${post.title} (${post.slug})`);
console.log(`Recipients processed: ${recipients.length}`);
console.log(`Sent: ${sentCount}`);
console.log(`Skipped: ${skippedCount}`);
console.log(`Failed: ${failedCount}`);
