import * as p from "@clack/prompts";
import pc from "picocolors";
import { ensureConfig } from "../lib/config-store.ts";
import { getNeonBranches } from "../lib/neon-api.ts";

export async function listCommand(): Promise<void> {
  const config = ensureConfig();
  const branches = await getNeonBranches(config.apiKey, config.projectId);

  if (branches.length === 0) {
    p.log.warning("No branches found.");
    return;
  }

  p.log.info(pc.bold(`Branches (${branches.length}):`));

  for (const branch of branches) {
    const primary = branch.primary ? pc.green(" (primary)") : "";
    const state =
      branch.current_state === "ready"
        ? pc.green("●")
        : pc.yellow("○");
    p.log.message(`  ${state} ${branch.name}${primary}`);
  }
}
