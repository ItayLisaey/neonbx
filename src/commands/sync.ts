import * as p from "@clack/prompts";
import pc from "picocolors";
import { ensureConfig } from "../lib/config-store.ts";
import { getCurrentBranch } from "../lib/git.ts";
import { getNeonBranches } from "../lib/neon-api.ts";
import { switchToBranch } from "./switch.ts";
import { handleCancel } from "../lib/cancel.ts";

export async function syncCommand(): Promise<void> {
  const config = ensureConfig();

  let gitBranch: string;
  try {
    gitBranch = getCurrentBranch();
  } catch (err) {
    p.log.error(
      err instanceof Error ? err.message : "Failed to get git branch."
    );
    process.exit(1);
  }

  p.log.info(`Current git branch: ${pc.bold(gitBranch)}`);

  const branches = await getNeonBranches(config.apiKey, config.projectId);

  // If on main/master git branch, use the configured default branch
  const targetName =
    gitBranch === "main" || gitBranch === "master"
      ? config.defaultBranch
      : gitBranch;

  const targetBranch = branches.find((b) => b.name === targetName);

  if (!targetBranch) {
    p.log.error(
      `No Neon branch found matching ${pc.bold(targetName)}.`
    );
    p.log.info(
      `Available branches: ${branches.map((b) => b.name).join(", ")}`
    );
    process.exit(1);
  }

  // Confirm if syncing to primary branch
  if (targetBranch.primary || targetBranch.name === config.defaultBranch) {
    const confirmed = await p.confirm({
      message: `Sync to ${pc.bold(targetBranch.name)} (primary branch)?`,
    });
    handleCancel(confirmed);
    if (!confirmed) {
      p.log.info("Sync cancelled.");
      return;
    }
  }

  await switchToBranch(targetBranch, config);
}
