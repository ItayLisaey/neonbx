import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  getConfig,
  setConfig,
  type NeonbxConfig,
  type SecretStorageType,
} from "../lib/config-store.ts";
import { storeSecrets } from "../lib/secret-store.ts";
import { handleCancel } from "../lib/cancel.ts";

export async function initCommand(): Promise<void> {
  p.intro(pc.cyan("neonbx") + " — Neon Branch Navigator");

  const current = getConfig();

  const projectId = await p.text({
    message: "Neon Project ID",
    placeholder: "ep-cool-darkness-123456",
    initialValue: current.projectId,
    validate: (v) => {
      if (!v.trim()) return "Project ID is required.";
    },
  });
  handleCancel(projectId);

  const apiKey = await p.password({
    message: "Neon API Key",
    validate: (v) => {
      if (!v?.trim()) return "API key is required.";
    },
  });
  handleCancel(apiKey);

  const secretStorage = await p.select({
    message: "Where should we store your secrets?",
    initialValue: (current.secretStorage ?? "env.local") as SecretStorageType,
    options: [
      {
        value: "env.local" as const,
        label: ".env.local",
        hint: "recommended — gitignored by default",
      },
      { value: "env" as const, label: ".env" },
      {
        value: "keychain" as const,
        label: "System Keychain",
        hint: "macOS Keychain",
      },
    ],
  });
  handleCancel(secretStorage);

  const envFilePath = await p.text({
    message: "Path to your .env file (for DB URLs)",
    initialValue: current.envFilePath ?? ".env.local",
    validate: (v) => {
      if (!v.trim()) return "Path is required.";
    },
  });
  handleCancel(envFilePath);

  const pooledKey = await p.text({
    message: "Pooled database URL env key",
    initialValue: current.pooledKey ?? "DATABASE_URL",
    validate: (v) => {
      if (!v.trim()) return "Key is required.";
    },
  });
  handleCancel(pooledKey);

  const unpooledKey = await p.text({
    message: "Unpooled database URL env key",
    initialValue: current.unpooledKey ?? "DATABASE_URL_UNPOOLED",
    validate: (v) => {
      if (!v.trim()) return "Key is required.";
    },
  });
  handleCancel(unpooledKey);

  const defaultBranch = await p.text({
    message: "Default DB branch for git `main`",
    initialValue: current.defaultBranch ?? "main",
    validate: (v) => {
      if (!v.trim()) return "Branch name is required.";
    },
  });
  handleCancel(defaultBranch);

  const s = p.spinner();
  s.start("Saving configuration...");

  const config: NeonbxConfig = {
    projectId: projectId as string,
    apiKey: apiKey as string,
    secretStorage: secretStorage as SecretStorageType,
    envFilePath: envFilePath as string,
    pooledKey: pooledKey as string,
    unpooledKey: unpooledKey as string,
    defaultBranch: defaultBranch as string,
  };

  setConfig(config);

  await storeSecrets(
    config.secretStorage,
    config.projectId,
    config.apiKey,
    config.secretStorage !== "keychain" ? config.envFilePath : undefined
  );

  s.stop("Configuration saved!");

  p.outro(
    `You're all set! Run ${pc.cyan("neonbx list")} to see your branches.`
  );
}
