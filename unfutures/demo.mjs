// Synthetic-only operator demonstration; does not reach any external system.
import { createHash } from "node:crypto";
import { makeFixture, propose, journal, summary } from "./engine.mjs";

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const fixture = makeFixture();
const local = propose(fixture, { federated: false });
const federated = propose(fixture);
const candidate = federated.plans.find(p => p.transports.length);
const j = journal(federated.plans, sha256);
for (const actor of candidate.requiredActors) {
  j.append("CONSENT", candidate.id, actor, { decision: "YES" });
}
j.append("REPORT", candidate.id, candidate.allocations[0].owner,
  { note: "SYNTHETIC DEMO ONLY; no physical fulfillment occurred" });
j.append("CONFIRM", candidate.id, candidate.requester, { decision: "YES" });
process.stdout.write(JSON.stringify({
  experiment: "UNFUTURES-001",
  environment: "SYNTHETIC_ONLY",
  connectedServices: [],
  realParticipants: 0,
  liveTransactions: 0,
  metrics: summary(local, federated, j.snapshot().states),
  example: {
    planId: candidate.id,
    needId: candidate.needId,
    route: candidate.transports.map(t => t.from + " -> " + t.to),
    requiredSyntheticApprovals: candidate.requiredActors.length,
    journalEntries: j.events.length,
    finalSyntheticState: j.snapshot().states[candidate.id].status
  },
  journalHeadSha256: j.snapshot().head,
  warning: "Actor strings are fixture labels, not authenticated identities; SHA-256 receipt chaining is not a signature or truth."
}, null, 2) + "\n");
