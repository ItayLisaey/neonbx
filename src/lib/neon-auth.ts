import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";

interface NeonCredentials {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope?: string;
  user_id?: string;
}

const CREDENTIALS_DIR =
  process.env.XDG_CONFIG_HOME ??
  path.join(os.homedir(), ".config", "neonctl");

const CREDENTIALS_PATH = path.join(CREDENTIALS_DIR, "credentials.json");

function readCredentials(): NeonCredentials | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as NeonCredentials;
  } catch {
    return null;
  }
}

function isExpired(creds: NeonCredentials): boolean {
  return Date.now() >= creds.expires_at;
}

export function runNeonAuth(): void {
  const s = p.spinner();
  s.start("Opening browser for Neon authentication...");

  try {
    execSync("npx neonctl@latest auth", {
      stdio: "inherit",
    });
    s.stop("Authenticated with Neon.");
  } catch {
    s.stop("Authentication failed.");
    p.log.error(
      `Could not authenticate. Make sure you have internet access and try again.`
    );
    process.exit(1);
  }
}

export function getAccessToken(): string {
  const creds = readCredentials();

  if (!creds) {
    p.log.error(
      `No Neon credentials found. Run ${pc.cyan("neonbx init")} to authenticate.`
    );
    process.exit(1);
  }

  if (isExpired(creds)) {
    p.log.warning("Neon token expired. Re-authenticating...");
    runNeonAuth();

    const refreshed = readCredentials();
    if (!refreshed || isExpired(refreshed)) {
      p.log.error("Failed to refresh Neon credentials.");
      process.exit(1);
    }
    return refreshed.access_token;
  }

  return creds.access_token;
}

export function hasCredentials(): boolean {
  const creds = readCredentials();
  return creds !== null && !isExpired(creds);
}
