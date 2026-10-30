// UNFUTURES-006 — synthetic-only setup, no arithmetic policy selection.
// All exact integer realization math is performed by ORIGINAL pinned Dogram Python.
import {prepareDogramAllocation} from "./allocation.mjs";
const packet=prepareDogramAllocation();
const mode=process.argv[2]??"summary";
let out;
if(mode==="specimens")out=packet;
else if(mode==="summary")out={
  experiment:"UNFUTURES-006",environment:packet.environment,
  dogramSourcePin:packet.sourceDogramPin,
  source005Fingerprint:packet.source005,
  weights:packet.trials[0].weights,
  discreteUnit:packet.trials[0].inputUnit,
  budgets:packet.comparison.budgets,
  policyNames:packet.comparison.twoPolicies,
  exactNativeAuditsToRun:packet.trials.length,
  sourceOfExactArithmetic:"PINNED_ORIGINAL_DOGRAM_PYTHON_NOT_JS",
  actualDistributedUnits:0,
  externalParticipants:0,
  humanAuthority:"NONE",
  boundary:"WEIGHTS_ARE_EDITORIAL_FIXTURE_PARAMETERS_NOT_REAL_NEEDS"
};
else throw Error("Accepted modes: summary, specimens");
process.stdout.write(JSON.stringify(out,null,2)+"\n");
