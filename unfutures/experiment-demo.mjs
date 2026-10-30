// UNFUTURES-005 synthetic-only experimental-economy export.
// These are preparation artifacts; only pinned native Dogram computes receipts.
import {constructExperimentalEconomy,publicFieldExperimentCandidate} from "./experiment.mjs";

const run=constructExperimentalEconomy();
const mode=process.argv[2]||"summary";
let out;
if(mode==="specimens") out=run;
else if(mode==="trial") out=publicFieldExperimentCandidate(run);
else if(mode==="summary") out={
  experiment:"UNFUTURES-005",
  environment:"SYNTHETIC_ONLY",
  calculator:"ORIGINAL_DOGRAM_PINNED_IN_CI",
  baselineGoalCount:run.experiments[0].baselineGoalCount,
  experimentalDesign:run.preregistration.design,
  hypotheses:run.experiments.map(t=>({
    id:t.hypothesisId,arms:t.outcomeCountByArm,
    predictedExactInteraction:t.exactInteractionExpected,
    evidenceGaps:t.missingEvidence,
    priorAuthority:t.startState
  })),
  preparedDogramSpecimens:run.specimens.length,
  realParticipants:0,realInterventions:0,realFieldEvidence:0,
  actualHumanReview:"NOT_YET_REQUESTED",
  operatorDecision:"HOLD",
  sourceDogram:run.dogramSource,
  warning:"Dogram can calculate exact differences and declared graph paths, never prove an actual intervention was beneficial."
};
else throw Error("Allowed: specimens, summary, trial");
process.stdout.write(JSON.stringify(out,null,2)+"\n");
