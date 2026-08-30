import { classifyRisk } from "./classifier.js";
import { buildRiskEvidence } from "./evidence.js";
import { materializeRepositoryCommitRange } from "./repository.js";

async function main(): Promise<void> {
  try {
    const [baseSha, headSha] = process.argv.slice(2);
    if (!baseSha || !headSha) throw new Error("usage: risk:classify-repo <baseSha> <headSha>");
    const materialized = await materializeRepositoryCommitRange(baseSha, headSha);
    const decision = classifyRisk(materialized.input);
    const evidence = buildRiskEvidence(decision, {
      evidenceComplete: materialized.evidenceComplete,
      sourceIdentity: materialized.sourceIdentity
    });
    process.stdout.write(`${JSON.stringify({ evidence, limitations: materialized.limitations }, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`risk-detector repository input error: ${message}\n`);
    process.exitCode = 2;
  }
}

await main();
