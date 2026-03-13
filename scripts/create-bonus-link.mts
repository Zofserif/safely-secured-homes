import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const seoModule = (await import(
  new URL("../app/lib/seo.ts", import.meta.url).href
)) as typeof import("../app/lib/seo");

const { normalizeSiteUrl } = seoModule;

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

const getBaseUrl = (): string => {
  const cliBaseUrl = readFlag("base-url");
  if (cliBaseUrl) return normalizeSiteUrl(cliBaseUrl);

  const envBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  return envBaseUrl ? normalizeSiteUrl(envBaseUrl) : "http://localhost:3000";
};

loadEnvFiles();

const baseUrl = getBaseUrl();
const adminSecret = process.env.BONUS_LINKS_ADMIN_SECRET?.trim();

if (!adminSecret) {
  throw new Error(
    "Missing BONUS_LINKS_ADMIN_SECRET. Add it to your env before creating bonus links.",
  );
}

const payload = {
  recipientName: readFlag("name"),
  recipientEmail: readFlag("email"),
  note: readFlag("note"),
};

const response = await fetch(new URL("/api/bonus-links", `${baseUrl}/`), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSecret}`,
  },
  body: JSON.stringify(payload),
});

const responseBody = (await response.json().catch(() => null)) as
  | { key?: string; url?: string; createdAt?: string; error?: string }
  | null;

if (!response.ok || !responseBody?.url || !responseBody.key) {
  throw new Error(
    responseBody?.error || "Failed to create bonus link from the API.",
  );
}

console.log(`Key: ${responseBody.key}`);
console.log(`Created: ${responseBody.createdAt ?? "Unknown"}`);
console.log(responseBody.url);
