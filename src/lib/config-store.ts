import Conf from "conf";
import * as p from "@clack/prompts";
import pc from "picocolors";

export interface NeonbxConfig {
  projectId: string;
  envFilePath: string;
  pooledKey: string;
  unpooledKey: string;
  defaultBranch: string;
}

const CONFIG_KEYS: (keyof NeonbxConfig)[] = [
  "projectId",
  "envFilePath",
  "pooledKey",
  "unpooledKey",
  "defaultBranch",
];

const config = new Conf<NeonbxConfig>({
  projectName: "neonbx",
});

export function getConfig(): Partial<NeonbxConfig> {
  const result: Partial<NeonbxConfig> = {};
  for (const key of CONFIG_KEYS) {
    const val = config.get(key);
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

export function setConfig(values: Partial<NeonbxConfig>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      config.set(key as keyof NeonbxConfig, value);
    }
  }
}

export function clearConfig(): void {
  config.clear();
}

export function getConfigValue<K extends keyof NeonbxConfig>(
  key: K
): NeonbxConfig[K] | undefined {
  return config.get(key);
}

export function setConfigValue<K extends keyof NeonbxConfig>(
  key: K,
  value: NeonbxConfig[K]
): void {
  config.set(key, value);
}

export function ensureConfig(): NeonbxConfig {
  const cfg = getConfig();
  if (!cfg.projectId) {
    p.log.error(
      `No configuration found. Run ${pc.cyan("neonbx init")} first.`
    );
    process.exit(1);
  }
  return cfg as NeonbxConfig;
}

export function getConfigPath(): string {
  return config.path;
}
