import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export function loadEnvFile(filePath: string): Record<string, string> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return {};
  }
  const content = fs.readFileSync(resolved, "utf-8");
  return parse(content);
}

export function setEnvValue(
  key: string,
  value: string,
  filePath: string
): void {
  const resolved = path.resolve(filePath);
  let content = "";

  if (fs.existsSync(resolved)) {
    content = fs.readFileSync(resolved, "utf-8");
  }

  const regex = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");

  if (regex.test(content)) {
    content = content.replace(regex, `${key}="${value}"`);
  } else {
    const newline = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
    content += `${newline}${key}="${value}"\n`;
  }

  fs.writeFileSync(resolved, content, "utf-8");
}

export function getCurrentConnectionURI(
  envFilePath: string,
  pooledKey: string
): string | undefined {
  const env = loadEnvFile(envFilePath);
  return env[pooledKey];
}

export function replaceConnection(
  pooledURI: string,
  unpooledURI: string,
  envFilePath: string,
  pooledKey: string,
  unpooledKey: string
): void {
  setEnvValue(pooledKey, pooledURI, envFilePath);
  setEnvValue(unpooledKey, unpooledURI, envFilePath);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
