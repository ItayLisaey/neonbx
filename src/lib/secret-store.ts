import { execSync } from "node:child_process";
import type { SecretStorageType } from "./config-store.ts";
import { loadEnvFile, setEnvValue } from "./env-store.ts";

export interface SecretStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
}

function createKeychainStore(): SecretStore {
  const SERVICE = "neonbx";

  return {
    async get(key: string): Promise<string | undefined> {
      try {
        const result = execSync(
          `security find-generic-password -s "${SERVICE}" -a "${key}" -w`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        ).trim();
        return result || undefined;
      } catch {
        return undefined;
      }
    },
    async set(key: string, value: string): Promise<void> {
      try {
        // Delete existing entry first (ignore errors if not found)
        execSync(
          `security delete-generic-password -s "${SERVICE}" -a "${key}" 2>/dev/null`,
          { stdio: "pipe" }
        );
      } catch {
        // Ignore — entry may not exist
      }
      execSync(
        `security add-generic-password -s "${SERVICE}" -a "${key}" -w "${value}"`,
        { stdio: "pipe" }
      );
    },
  };
}

function createEnvFileStore(filePath: string): SecretStore {
  return {
    async get(key: string): Promise<string | undefined> {
      const env = loadEnvFile(filePath);
      return env[key];
    },
    async set(key: string, value: string): Promise<void> {
      setEnvValue(key, value, filePath);
    },
  };
}

export function createSecretStore(
  type: SecretStorageType,
  envFilePath?: string
): SecretStore {
  if (type === "keychain") {
    return createKeychainStore();
  }

  const filePath = type === "env.local" ? ".env.local" : ".env";
  return createEnvFileStore(envFilePath ?? filePath);
}

export async function storeSecrets(
  type: SecretStorageType,
  projectId: string,
  apiKey: string,
  envFilePath?: string
): Promise<void> {
  const store = createSecretStore(type, envFilePath);
  await store.set("NEON_PROJECT_ID", projectId);
  await store.set("NEON_API_KEY", apiKey);
}

export async function loadSecrets(
  type: SecretStorageType,
  envFilePath?: string
): Promise<{ projectId?: string; apiKey?: string }> {
  const store = createSecretStore(type, envFilePath);
  return {
    projectId: await store.get("NEON_PROJECT_ID"),
    apiKey: await store.get("NEON_API_KEY"),
  };
}
