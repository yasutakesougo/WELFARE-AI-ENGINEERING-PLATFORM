import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { materializeRiskInput, type MaterializedRiskInput } from "./materialize.js";

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

export async function materializeRepositoryCommitRange(baseSha: string, headSha: string): Promise<MaterializedRiskInput> {
  if (!FULL_SHA.test(baseSha) || !FULL_SHA.test(headSha)) throw new Error("exact 40-character baseSha and headSha are required");

  await git(["cat-file", "-e", `${baseSha}^{commit}`]);
  await git(["cat-file", "-e", `${headSha}^{commit}`]);

  const [namesRaw, diff, numstat] = await Promise.all([
    git(["diff", "--name-only", "--no-renames", baseSha, headSha]),
    git(["diff", "--no-ext-diff", "--no-textconv", "--no-renames", baseSha, headSha]),
    git(["diff", "--numstat", "--no-renames", baseSha, headSha])
  ]);

  const changedFiles = namesRaw.split("\n").filter(Boolean);
  const binaryFiles = numstat
    .split("\n")
    .filter((line) => line.startsWith("-\t-\t"))
    .map((line) => line.split("\t").slice(2).join("\t"));

  return materializeRiskInput({
    mode: "REPOSITORY_COMMIT_RANGE",
    baseSha,
    headSha,
    changedFiles,
    diff,
    binaryFiles
  });
}
