// UNFUTURES-004: offline, synthetic-only question → scenario → review packet.
import {createHash} from "node:crypto";
import {imagine, iterateInquiry, toAttentionPacket, reviewJournal} from "./imagination.mjs";
const hash=s=>createHash("sha256").update(s).digest("hex");
const result=imagine();
const inquiry=iterateInquiry(result,{rounds:2});
const mode=process.argv[2]??"summary";
let output;
if(mode==="summary"){
  output={
    experiment:"UNFUTURES-004",scope:"SYNTHETIC_ONLY",
    initialGoals:result.baseline.goalCount,
    originalWeightedCoverage:result.baseline.weightedPriority,
    proposedHypotheses:result.considered,
    selectedForHumanReview:result.suggestedForHumanReview,
    evidenceQuestions:inquiry.questions.length,
    candidates:result.hypotheses.map(x=>({
      id:x.id,original:x.cases.baseline.goalCount,
      hypothesisOnly:x.cases.recipeOnly.goalCount,
      assumedInputOnly:x.cases.inputOnly.goalCount,
      combinedWhatIf:x.cases.combined.goalCount,
      missing:x.bottlenecks.selectedPlanResidual,
      evidenceStillRequired:x.evidenceRequired.length,
      disposition:x.reviewStatus
    })),
    realWorkers:0,realResourcesAdded:0,realWorldImprovements:0,
    note:"The improvement occurs only in an explicitly hypothetical scenario."
  };
}else if(mode==="lab")output=result;
else if(mode==="inquiry")output=inquiry;
else if(mode==="attention")output=toAttentionPacket(result,inquiry);
else if(mode==="review-simulation"){
  const selected=result.hypotheses.find(x=>x.id===result.suggestedForHumanReview);
  const log=reviewJournal(result,hash);
  log.append(selected.id,selected.reviewer,"REQUEST_EVIDENCE",
    "SYNTHETIC reviewer requests verified safety, consent, and access evidence.");
  output={schema:"unfutures.review-004/v0",environment:"SYNTHETIC_ONLY",
    events:log.events,state:log.snapshot(),note:"Synthetic reviewer alias only; no human authorized work."};
}else throw Error("Allowed: summary, lab, inquiry, attention, review-simulation");
process.stdout.write(JSON.stringify(output,null,2)+"\n");
