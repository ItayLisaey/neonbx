import * as p from "@clack/prompts";
import { getAccessToken } from "./neon-auth.ts";

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

interface NeonProject {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
}

async function neonFetchRaw<T>(url: string): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neon API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

async function neonFetch<T>(path: string, projectId: string): Promise<T> {
  return neonFetchRaw<T>(`${BASE_URL}/projects/${projectId}${path}`);
}

export async function getNeonProjects(): Promise<NeonProject[]> {
  const s = p.spinner();
  s.start("Fetching projects from Neon...");

  try {
    const data = await neonFetchRaw<{ projects: NeonProject[] }>(
      `${BASE_URL}/projects`
    );
    s.stop("Projects loaded.");
    return data.projects;
  } catch (err) {
    s.stop("Failed to fetch projects.");
    throw err;
  }
}

export async function getNeonBranches(
  projectId: string
): Promise<NeonBranch[]> {
  const s = p.spinner();
  s.start("Fetching branches from Neon...");

  try {
    const data = await neonFetch<{ branches: NeonBranch[] }>(
      "/branches",
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
  projectId: string,
  branchId?: string
): Promise<NeonEndpoint[]> {
  const path = branchId
    ? `/branches/${branchId}/endpoints`
    : "/endpoints";
  const data = await neonFetch<{ endpoints: NeonEndpoint[] }>(
    path,
    projectId
  );
  return data.endpoints;
}

export async function getNeonBranchConnectionURI(
  branchId: string,
  projectId: string,
  pooled: boolean = true
): Promise<string> {
  const params = new URLSearchParams({
    branch_id: branchId,
    role_name: "neondb_owner",
    database_name: "neondb",
  });
  if (pooled) {
    params.set("pooled", "true");
  }

  const data = await neonFetch<{ uri: string }>(
    `/connection_uri?${params}`,
    projectId
  );
  return data.uri;
}

export type { NeonBranch, NeonEndpoint };
