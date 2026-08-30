import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  MAX_DIFF_CHARS,
  materializeRiskInput,
  type MaterializedRiskInput
} from "./materialize.js";

const execFileAsync = promisify(execFile);
const FULL_SHA = /^[0-9a-f]{40}$/i;
const MAX_GIT_BUFFER = 1_000_000;

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    encoding: "utf8",
    maxBuffer: MAX_GIT_BUFFER,
    shell: false
  });
  return stdout;
}

async function gitBounded(args: string[]): Promise<{ stdout: string; truncated: boolean }> {
  try {
    return { stdout: await git(args), truncated: false };
  } catch (error) {
    const maybe = error as { code?: string; stdout?: string | Buffer; message?: string };
    const isBufferOverflow = maybe.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" || maybe.message?.includes("maxBuffer") === true;
    if (!isBufferOverflow) throw error;
    const stdout = typeof maybe.stdout === "string" ? maybe.stdout : Buffer.isBuffer(maybe.stdout) ? maybe.stdout.toString("utf8") : "";
    return { stdout: stdout.slice(0, MAX_DIFF_CHARS), truncated: true };
  }
}

export async function materializeRepositoryCommitRange(baseSha: string, headSha: string): Promise<MaterializedRiskInput> {
  if (!FULL_SHA.test(baseSha) || !FULL_SHA.test(headSha)) throw new Error("exact 40-character baseSha and headSha are required");

  await git(["cat-file", "-e", `${baseSha}^{commit}`]);
  await git(["cat-file", "-e", `${headSha}^{commit}`]);

  const [namesResult, diffResult, numstatResult] = await Promise.all([
    gitBounded(["diff", "--name-only", "--no-renames", baseSha, headSha]),
    gitBounded(["diff", "--no-ext-diff", "--no-textconv", "--no-renames", baseSha, headSha]),
    gitBounded(["diff", "--numstat", "--no-renames", baseSha, headSha])
  ]);

  const changedFiles = namesResult.stdout.split("\n").filter(Boolean);
  const binaryFiles = numstatResult.stdout
    .split("\n")
    .filter((line) => line.startsWith("-\t-\t"))
    .map((line) => line.split("\t").slice(2).join("\t"));

  return materializeRiskInput({
    mode: "REPOSITORY_COMMIT_RANGE",
    baseSha,
    headSha,
    changedFiles,
    diff: diffResult.stdout,
    binaryFiles,
    truncated: namesResult.truncated || diffResult.truncated || numstatResult.truncated
  });
}
