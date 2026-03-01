import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  getConfig,
  clearConfig,
  getConfigPath,
  setConfigValue,
  type NeonbxConfig,
} from "../lib/config-store.ts";
import { hasCredentials } from "../lib/neon-auth.ts";
import { handleCancel } from "../lib/cancel.ts";

export function showConfig(): void {
  const config = getConfig();

  if (!config.projectId) {
    p.log.warning(
      `No configuration found. Run ${pc.cyan("neonbx init")} first.`
    );
    return;
  }

  p.intro(pc.cyan("neonbx") + " — Current Config");

  const entries: [string, string][] = [
    ["Project ID", config.projectId ?? pc.dim("(not set)")],
    ["Auth", hasCredentials() ? pc.green("authenticated") : pc.red("not authenticated")],
    ["Env File Path", config.envFilePath ?? pc.dim("(not set)")],
    ["Pooled Key", config.pooledKey ?? pc.dim("(not set)")],
    ["Unpooled Key", config.unpooledKey ?? pc.dim("(not set)")],
    ["Default Branch", config.defaultBranch ?? pc.dim("(not set)")],
  ];

  for (const [label, value] of entries) {
    p.log.info(`${pc.bold(label)}: ${value}`);
  }

  p.log.message(pc.dim(`Config file: ${getConfigPath()}`));
  p.outro("");
}

const VALID_KEYS: (keyof NeonbxConfig)[] = [
  "projectId",
  "envFilePath",
  "pooledKey",
  "unpooledKey",
  "defaultBranch",
];

export function setConfigCommand(key: string, value: string): void {
  if (!VALID_KEYS.includes(key as keyof NeonbxConfig)) {
    p.log.error(
      `Invalid config key: ${pc.bold(key)}. Valid keys: ${VALID_KEYS.join(", ")}`
    );
    process.exit(1);
  }

  setConfigValue(key as keyof NeonbxConfig, value as never);
  p.log.success(`Set ${pc.bold(key)} = ${value}`);
}

export async function resetConfig(): Promise<void> {
  const confirm = await p.confirm({
    message: "Are you sure you want to clear all config?",
  });
  handleCancel(confirm);

  if (confirm) {
    clearConfig();
    p.log.success("Configuration cleared.");
  } else {
    p.log.info("Reset cancelled.");
  }
}
