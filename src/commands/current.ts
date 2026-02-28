import * as p from "@clack/prompts";
import pc from "picocolors";
import { ensureConfig } from "../lib/config-store.ts";
import { getCurrentConnectionURI } from "../lib/env-store.ts";
import { getNeonBranches, getNeonEndpoints } from "../lib/neon-api.ts";

export async function currentCommand(): Promise<void> {
  const config = ensureConfig();

  const uri = getCurrentConnectionURI(config.envFilePath, config.pooledKey);
  if (!uri) {
    p.log.warning(
      `No ${pc.bold(config.pooledKey)} found in ${pc.bold(config.envFilePath)}.`
    );
    return;
  }

  const s = p.spinner();
  s.start("Resolving current branch...");

  try {
    const [branches, endpoints] = await Promise.all([
      getNeonBranches(config.apiKey, config.projectId),
      getNeonEndpoints(config.apiKey, config.projectId),
    ]);

    // Extract the host from the connection URI to match against endpoints
    const uriHost = extractHost(uri);

    const matchedEndpoint = endpoints.find(
      (ep) => uriHost && ep.host && uriHost.includes(ep.host.split(".")[0])
    );

    if (!matchedEndpoint) {
      s.stop("Could not determine current branch.");
      p.log.warning(
        "Could not match the current connection URI to any Neon endpoint."
      );
      return;
    }

    const branch = branches.find((b) => b.id === matchedEndpoint.branch_id);

    s.stop("Branch resolved.");

    if (branch) {
      p.log.success(`Current branch: ${pc.bold(pc.green(branch.name))}`);
    } else {
      p.log.warning(
        `Endpoint found but branch ID ${matchedEndpoint.branch_id} not in branch list.`
      );
    }
  } catch (err) {
    s.stop("Failed.");
    throw err;
  }
}

function extractHost(uri: string): string | null {
  try {
    const url = new URL(uri);
    return url.hostname;
  } catch {
    return null;
  }
}
