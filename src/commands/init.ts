import * as p from "@clack/prompts";
import pc from "picocolors";
import { getConfig, setConfig, type NeonbxConfig } from "../lib/config-store.ts";
import { runNeonAuth, hasCredentials } from "../lib/neon-auth.ts";
import { getNeonProjects } from "../lib/neon-api.ts";
import { handleCancel } from "../lib/cancel.ts";

export async function initCommand(): Promise<void> {
  p.intro(pc.cyan("neonbx") + " — Neon Branch Navigator");

  const current = getConfig();

  // OAuth authentication
  if (hasCredentials()) {
    const reauth = await p.confirm({
      message: "Already authenticated with Neon. Re-authenticate?",
      initialValue: false,
    });
    handleCancel(reauth);
    if (reauth) {
      runNeonAuth();
    }
  } else {
    p.log.info("Let's connect to your Neon account.");
    runNeonAuth();
  }

  // Fetch projects and let user pick
  const projects = await getNeonProjects();

  if (projects.length === 0) {
    p.log.error("No projects found in your Neon account.");
    process.exit(1);
  }

  let projectId: string;

  if (projects.length === 1) {
    projectId = projects[0].id;
    p.log.info(`Using project: ${pc.bold(projects[0].name)} ${pc.dim(`(${projectId})`)}`);
  } else {
    const selected = await p.select({
      message: "Select a Neon project",
      initialValue: current.projectId,
      options: projects.map((proj) => ({
        value: proj.id,
        label: proj.name,
        hint: proj.id,
      })),
    });
    handleCancel(selected);
    projectId = selected as string;
  }

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

  const config: NeonbxConfig = {
    projectId,
    envFilePath: envFilePath as string,
    pooledKey: pooledKey as string,
    unpooledKey: unpooledKey as string,
    defaultBranch: defaultBranch as string,
  };

  setConfig(config);

  p.outro(
    `You're all set! Run ${pc.cyan("neonbx list")} to see your branches.`
  );
}
