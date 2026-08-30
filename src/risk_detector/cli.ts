import { readFile } from "node:fs/promises";
import { classifyRisk } from "./classifier.js";
import type { RiskInput } from "./types.js";

async function readInput(path: string | undefined): Promise<RiskInput> {
  if (path) {
    return JSON.parse(await readFile(path, "utf8")) as RiskInput;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as RiskInput) : {};
}

async function main(): Promise<void> {
  try {
    const input = await readInput(process.argv[2]);
    process.stdout.write(`${JSON.stringify(classifyRisk(input), null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`risk-detector input error: ${message}\n`);
    process.exitCode = 2;
  }
}

await main();
