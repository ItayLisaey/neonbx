import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import pc from "picocolors";

const PKG_NAME = "neonbx";
const CACHE_DIR = path.join(os.tmpdir(), PKG_NAME);
const CACHE_FILE = path.join(CACHE_DIR, "update-check.json");
const CHECK_INTERVAL = 1000 * 60 * 60 * 4; // 4 hours

interface CachedCheck {
  latest: string;
  checkedAt: number;
}

function getRunCommand(): string {
  const execPath = process.env._ ?? "";
  const npmExecpath = process.env.npm_execpath ?? "";
  const userAgent = process.env.npm_config_user_agent ?? "";

  // Detect pnpx / pnpm dlx
  if (
    userAgent.includes("pnpm") ||
    execPath.includes("pnpm") ||
    execPath.includes("pnpx")
  ) {
    return `pnpm add -g ${PKG_NAME}`;
  }

  // Detect yarn
  if (
    userAgent.includes("yarn") ||
    npmExecpath.includes("yarn")
  ) {
    return `yarn global add ${PKG_NAME}`;
  }

  // Detect bun
  if (
    userAgent.includes("bun") ||
    execPath.includes("bun")
  ) {
    return `bun add -g ${PKG_NAME}`;
  }

  // Default to npm
  return `npm i -g ${PKG_NAME}`;
}

function compareVersions(current: string, latest: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const c = parse(current);
  const l = parse(latest);

  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

function readCache(): CachedCheck | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(data: CachedCheck): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // Ignore cache write failures
  }
}

export async function checkForUpdates(currentVersion: string): Promise<void> {
  try {
    const cached = readCache();

    let latest: string;

    if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL) {
      latest = cached.latest;
    } else {
      // Fire and forget — don't slow down CLI startup
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `https://registry.npmjs.org/${PKG_NAME}/latest`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) return;

      const data = (await res.json()) as { version: string };
      latest = data.version;
      writeCache({ latest, checkedAt: Date.now() });
    }

    if (compareVersions(currentVersion, latest)) {
      const cmd = getRunCommand();
      console.log(
        `\n  ${pc.yellow("Update available!")} ${pc.dim(currentVersion)} → ${pc.green(latest)}` +
        `\n  Run ${pc.cyan(cmd)} to update\n`
      );
    }
  } catch {
    // Never block CLI on update check failure
  }
}
