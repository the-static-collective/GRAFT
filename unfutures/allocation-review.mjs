// Materialize an offline, explicitly held review packet from a checked native witness.
// The file never affects a real ledger, program, volunteer, treasury or stock location.
import {readFileSync} from "node:fs";
import {heldDistributionCandidate} from "./allocation.mjs";
const filename=process.argv[2];
if(!filename)throw Error("Usage: node allocation-review.mjs native-witness.json");
const source=readFileSync(filename,"utf-8");
if(source.length>250000)throw Error("Native witness too large");
const report=JSON.parse(source);
process.stdout.write(JSON.stringify(heldDistributionCandidate(report),null,2)+"\n");
