import * as p from "@clack/prompts";
import pc from "picocolors";
import { ensureConfig } from "../lib/config-store.ts";
import {
  getNeonBranches,
  getNeonEndpoints,
  getNeonBranchConnectionURI,
  type NeonBranch,
} from "../lib/neon-api.ts";
import { replaceConnection } from "../lib/env-store.ts";
import { handleCancel } from "../lib/cancel.ts";

export async function switchCommand(branchName?: string): Promise<void> {
  const config = ensureConfig();
  const branches = await getNeonBranches(config.apiKey, config.projectId);

  let targetBranch: NeonBranch | undefined;

  if (branchName) {
    targetBranch = branches.find((b) => b.name === branchName);
    if (!targetBranch) {
      p.log.error(`Branch ${pc.bold(branchName)} not found.`);
      process.exit(1);
    }
  } else {
    const selected = await p.select({
      message: "Select a branch to switch to",
      options: branches.map((b) => ({
        value: b.name,
        label: b.name,
        hint: b.primary ? "primary" : undefined,
      })),
    });
    handleCancel(selected);
    targetBranch = branches.find((b) => b.name === selected)!;
  }

  // Confirm if switching to default/main branch
  if (targetBranch.primary || targetBranch.name === config.defaultBranch) {
    const confirmed = await p.confirm({
      message: `Switch to ${pc.bold(targetBranch.name)} (primary branch)?`,
    });
    handleCancel(confirmed);
    if (!confirmed) {
      p.log.info("Switch cancelled.");
      return;
    }
  }

  await switchToBranch(targetBranch, config);
}

export async function switchToBranch(
  branch: NeonBranch,
  config: ReturnType<typeof ensureConfig>
): Promise<void> {
  const s = p.spinner();
  s.start(`Switching to ${pc.bold(branch.name)}...`);

  try {
    const endpoints = await getNeonEndpoints(
      config.apiKey,
      config.projectId,
      branch.id
    );

    if (endpoints.length === 0) {
      s.stop("Failed.");
      p.log.error(`No endpoints found for branch ${pc.bold(branch.name)}.`);
      return;
    }

    const endpoint = endpoints[0];

    const [pooledURI, unpooledURI] = await Promise.all([
      getNeonBranchConnectionURI(
        branch.id,
        endpoint.id,
        config.apiKey,
        config.projectId,
        true
      ),
      getNeonBranchConnectionURI(
        branch.id,
        endpoint.id,
        config.apiKey,
        config.projectId,
        false
      ),
    ]);

    replaceConnection(
      pooledURI,
      unpooledURI,
      config.envFilePath,
      config.pooledKey,
      config.unpooledKey
    );

    s.stop(`Switched to ${pc.bold(pc.green(branch.name))}.`);

    p.log.success(
      `Updated ${pc.bold(config.pooledKey)} and ${pc.bold(config.unpooledKey)} in ${pc.bold(config.envFilePath)}`
    );
  } catch (err) {
    s.stop("Failed to switch branch.");
    throw err;
  }
}
