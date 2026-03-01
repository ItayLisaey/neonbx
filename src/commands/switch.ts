import * as p from "@clack/prompts";
import pc from "picocolors";
import { ensureConfig, type NeonbxConfig } from "../lib/config-store.ts";
import {
  getNeonBranches,
  getNeonBranchConnectionURI,
  type NeonBranch,
} from "../lib/neon-api.ts";
import { replaceConnection } from "../lib/env-store.ts";
import { handleCancel } from "../lib/cancel.ts";

export async function switchCommand(branchName?: string): Promise<void> {
  const config = ensureConfig();
  const branches = await getNeonBranches(config.projectId);

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

  if (targetBranch.primary || targetBranch.name === config.defaultBranch) {
    await confirmMainBranch(targetBranch.name);
  }

  await switchToBranch(targetBranch, config);
}

export async function confirmMainBranch(branchName: string): Promise<void> {
  p.log.warning(
    `${pc.bold(branchName)} is a protected branch.`
  );
  const typed = await p.text({
    message: `Type ${pc.bold(branchName)} to confirm`,
    validate: (v) => {
      if (v !== branchName) return `You must type "${branchName}" exactly to proceed.`;
    },
  });
  handleCancel(typed);
}

export async function switchToBranch(
  branch: NeonBranch,
  config: NeonbxConfig
): Promise<void> {
  const s = p.spinner();
  s.start(`Switching to ${pc.bold(branch.name)}...`);

  try {
    const [pooledURI, unpooledURI] = await Promise.all([
      getNeonBranchConnectionURI(branch.id, config.projectId, true),
      getNeonBranchConnectionURI(branch.id, config.projectId, false),
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
