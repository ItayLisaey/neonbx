import * as p from "@clack/prompts";

const BASE_URL = "https://console.neon.tech/api/v2";

interface NeonBranch {
  id: string;
  name: string;
  project_id: string;
  primary: boolean;
  created_at: string;
  current_state: string;
}

interface NeonEndpoint {
  id: string;
  host: string;
  branch_id: string;
  project_id: string;
  type: string;
  pooler_enabled: boolean;
}

interface NeonConnectionURI {
  uri: string;
}

async function neonFetch<T>(
  path: string,
  apiKey: string,
  projectId: string
): Promise<T> {
  const url = `${BASE_URL}/projects/${projectId}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neon API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getNeonBranches(
  apiKey: string,
  projectId: string
): Promise<NeonBranch[]> {
  const s = p.spinner();
  s.start("Fetching branches from Neon...");

  try {
    const data = await neonFetch<{ branches: NeonBranch[] }>(
      "/branches",
      apiKey,
      projectId
    );
    s.stop("Branches loaded.");
    return data.branches;
  } catch (err) {
    s.stop("Failed to fetch branches.");
    throw err;
  }
}

export async function getNeonEndpoints(
  apiKey: string,
  projectId: string,
  branchId?: string
): Promise<NeonEndpoint[]> {
  const path = branchId
    ? `/branches/${branchId}/endpoints`
    : "/endpoints";
  const data = await neonFetch<{ endpoints: NeonEndpoint[] }>(
    path,
    apiKey,
    projectId
  );
  return data.endpoints;
}

export async function getNeonBranchConnectionURI(
  branchId: string,
  endpointId: string,
  apiKey: string,
  projectId: string,
  pooled: boolean = true
): Promise<string> {
  const params = new URLSearchParams({
    role_name: "neondb_owner",
    database_name: "neondb",
  });
  if (pooled) {
    params.set("pooled", "true");
  }

  const data = await neonFetch<{ uri: string }>(
    `/branches/${branchId}/endpoints/${endpointId}/connection_uri?${params}`,
    apiKey,
    projectId
  );
  return data.uri;
}

export function getEndpointHost(endpoint: NeonEndpoint, pooled: boolean): string {
  const host = endpoint.host;
  if (pooled) {
    return host.replace(/\./, "-pooler.");
  }
  return host;
}

export type { NeonBranch, NeonEndpoint };
