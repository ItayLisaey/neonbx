import { execSync } from "node:child_process";

export function getCurrentBranch(): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    throw new Error("Not a git repository or git is not installed.");
  }
}
