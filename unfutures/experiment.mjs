// UNFUTURES-005 — Dogram × Experimental Economy.
// This organ prepares a synthetic, preregistered FOUR-ARM mathematics specimen.
// It never admits real observations, actual inventory, people, or field evidence.
// Original Dogram Python, run separately at a pinned SHA, performs the calculations.
import {createHash} from "node:crypto";
import {stable} from "./engine.mjs";
import {imagine} from "./imagination.mjs";

const hash = v=>createHash("sha256").update(stable(v)).digest("hex");
const number = n=>{
  if(!Number.isSafeInteger(n)) throw Error("Only exact integer outcomes allowed");
  return {kind:"integer",value:n};
};
const specimen=(id,operator,inputs,metadata)=>({
  schema:"dogram.specimen/v0",
  specimen_id:id,operator,operator_version:1,
  inputs,assumptions:["All quantities are fictional outputs of the UNFUTURES-003 planner, not field evidence."],
  metadata
});
const sortedUnique = xs=>[...new Set(xs)].sort();
export const DOGRAM_SOURCE_PIN="551b5f9df18f17ec69b452ddcdff01718e0ff771";

export function constructExperimentalEconomy(result=imagine()){
  if(result?.schema!=="unfutures.imagination-004/v0"
    ||result.environment!=="SYNTHETIC_ONLY"
    ||result.noExecution!==true||result.noLiveIntegration!==true)
    throw Error("Only held synthetic imagination results may be experimented with");
  const hypotheses=result.hypotheses;
  if(hypotheses.length!==2 || hypotheses.some(h=>h.reviewStatus!=="HOLD_EVIDENCE_AND_HUMAN_REVIEW"))
    throw Error("Unexpected bounded editorial specimen");
  const experiments=hypotheses.map(h=>{
    const cases=h.cases;
    const outcomes={
      "00":cases.baseline.goalCount,
      "10":cases.recipeOnly.goalCount,
      "01":cases.inputOnly.goalCount,
      "11":cases.combined.goalCount
    };
    Object.values(outcomes).forEach(x=>number(x));
    const weighted={
      "00":cases.baseline.weightedPriority,
      "10":cases.recipeOnly.weightedPriority,
      "01":cases.inputOnly.weightedPriority,
      "11":cases.combined.weightedPriority
    };
    Object.values(weighted).forEach(x=>number(x));
    const difference=outcomes["11"]-outcomes["10"]-outcomes["01"]+outcomes["00"];
    const weightedDifference=weighted["11"]-weighted["10"]-weighted["01"]+weighted["00"];
    const contract={
      id:"trial:"+h.id,
      hypothesisId:h.id,sourceHypothesisHash:h.proposalHash,
      name:h.question,
      baselineGoalCount:outcomes["00"],
      outcomeCountByArm:outcomes,
      weightedPriorityByArm:weighted,
      exactInteractionExpected:difference,
      weightedInteractionExpected:weightedDifference,
      missingEvidence:sortedUnique(h.evidenceRequired),
      assumptions:h.assumptions,
      sampling:"DETERMINISTIC_SYNTHETIC_FIXTURE_NO_HUMAN_SAMPLE",
      experimentalDesign:"TWO_FACTOR_FOUR_ARM_COUNTERFACTUAL",
      validity:"CALCULATED_NOT_CAUSAL",
      humanApproval:"NOT_REQUESTED",
      outcomeAuthority:"NONE",
      startState:"HOLD",
      reasonToReject:h.change.combinedGain<=0?"NO_DECLARED_GOAL_GAIN":"NONE_IDENTIFIED_BY_FIXTURE"
    };
    return contract;
  });
  const current=experiments.find(e=>e.hypothesisId==="h-pop-up-table");
  const alternative=experiments.find(e=>e.hypothesisId==="h-route-table");
  if(!current || !alternative)throw Error("Missing expected fixtures");

  const tracedGraph={
    nodes:["recipe","volunteer-gate","proposed-service","goal"],
    edges:[
      ["recipe","volunteer-gate"],
      ["volunteer-gate","proposed-service"],
      ["proposed-service","goal"]
    ]
  };
  const incompleteGraph={
    ...tracedGraph,
    edges:tracedGraph.edges.filter(e=>!(e[0]==="volunteer-gate"&&e[1]==="proposed-service"))
  };
  // Graph is a deliberately SERIALIZED DECLARED dependency chain.
  // Reachability is NOT a proof of an AND condition or actual field causal effect.
  const meta={unfutures:"005",scope:"SYNTHETIC_ONLY",
    sourceFingerprint:result.sourceFingerprint,
    dogramGitSha:DOGRAM_SOURCE_PIN,
    authority:"NONE"};

  const specimens=[
    specimen("unfutures-005-main-rectangle","rectangle",{
      axis_a:"new_recipe_declared",
      axis_b:"additional_volunteer_assumed",
      cells:Object.fromEntries(Object.entries(current.outcomeCountByArm)
        .map(([k,v])=>[k,number(v)]))
    },{...meta,hypothesisId:current.hypothesisId,metric:"goal_count"}),
    specimen("unfutures-005-weighted-rectangle","rectangle",{
      axis_a:"new_recipe_declared",
      axis_b:"additional_volunteer_assumed",
      cells:Object.fromEntries(Object.entries(current.weightedPriorityByArm)
        .map(([k,v])=>[k,number(v)]))
    },{...meta,hypothesisId:current.hypothesisId,metric:"declared_priority_sum"}),
    specimen("unfutures-005-control-rectangle","rectangle",{
      axis_a:"new_recipe_declared",
      axis_b:"additional_volunteer_assumed",
      cells:Object.fromEntries(Object.entries(alternative.outcomeCountByArm)
        .map(([k,v])=>[k,number(v)]))
    },{...meta,hypothesisId:alternative.hypothesisId,metric:"goal_count",control:"NON_IMPROVING"}),
    specimen("unfutures-005-first-delta","delta",{
      boundary_order:["goal_count","weighted_priority"],
      left:{
        goal_count:number(current.outcomeCountByArm["00"]),
        weighted_priority:number(current.weightedPriorityByArm["00"])
      },
      right:{
        goal_count:number(current.outcomeCountByArm["11"]),
        weighted_priority:number(current.weightedPriorityByArm["11"])
      }
    },{...meta,hypothesisId:current.hypothesisId}),
    specimen("unfutures-005-volunteer-ablate","ablate",{
      graph:tracedGraph,
      target:{kind:"node",node:"volunteer-gate"},
      requested_targets:[["recipe","goal"],["proposed-service","goal"]]
    },{...meta,hypothesisId:current.hypothesisId,
      warning:"DECLARED SERIAL GRAPH ONLY; NO CAUSAL ATTRIBUTION"}),
    specimen("unfutures-005-bridge-reach","reach",{
      graph:incompleteGraph,
      mutation:{op:"ADD_EDGE",source:"volunteer-gate",target:"proposed-service"},
      queries:[["recipe","goal"],["proposed-service","goal"]]
    },{...meta,hypothesisId:current.hypothesisId,
      warning:"DECLARED SERIAL GRAPH ONLY; NO CAUSAL ATTRIBUTION"})
  ];
  return {
    schema:"unfutures.experiment-005/v0",
    environment:"SYNTHETIC_ONLY",
    sourceFingerprint:result.sourceFingerprint,
    dogramSource:{repository:"the-static-collective/Dogram",
      ref:DOGRAM_SOURCE_PIN,execution:"PINNED_NATIVE_PYTHON_IN_CI"},
    experimentCount:experiments.length,
    experiments,
    specimens,
    preregistration:{
      design:"FOUR_ARM_TWO_FACTOR",
      comparisons:["baseline","recipe_only","input_only","both"],
      exactArithmetic:true,
      requiredIndependentChecks:[
        "native-dogram-rectangle-first-and-mixed-difference",
        "native-dogram-ablation-declared-gate",
        "native-dogram-reachability-declared-bridge",
        "native-dogram-delta-ordered-boundary"
      ],
      falsifiers:[
        "Combined arm fails to outperform baseline in the declared integer metric",
        "Control rectangle shows unexpected interaction",
        "Removing declared gate does not eliminate the declared recipe-to-goal graph path",
        "Recipe relies on volunteer, kitchen, or safety permission not actually granted",
        "The method depends on resources already allocated to incompatible goals"
      ],
      hypotheticalImprovementIsNotObserved:true,
      externalObservations:[],
      actualVoluntaryParticipants:0,
      realInterventions:0,
      publicClaimsOfEffect:0,
      action:"DESIGN_REVERSIBLE_PILOT_AFTER_ACTUAL_AUTHORITY"
    },
    admissions:{
      calculate:true,
      compare:true,
      savePublicSyntheticReceipts:true,
      recruit:false,signAgreements:false,
      execute:false,dispatch:false,
      promoteHypotheticalOutput:false,
      createRealEvidence:false
    },
    purpose:"Math pressure before field trials. Dogram calculates, it does not decide."
  };
}

export function publicFieldExperimentCandidate(work){
  if(work?.schema!=="unfutures.experiment-005/v0"
     ||work.environment!=="SYNTHETIC_ONLY") throw Error("Synthetic experiment required");
  return {
    schema:"jarvis.work-candidate.unfutures-005/v0",
    status:"DRAFT_FOR_OPERATOR_HOLD",
    sourceFingerprint:work.sourceFingerprint,
    sourceDogramPin:work.dogramSource.ref,
    proposal:work.experiments.find(x=>x.hypothesisId==="h-pop-up-table").id,
    question:"Could a small, authorized pop-up community table be feasible without reallocating existing care commitments?",
    ownerOfDecision:"UNSELECTED_EXTERNAL_HUMAN_STEWARD",
    notAnEnrollment:true,
    recommendedInitialActivity:"ASK_AN_ADULT_ORGANIZATION_TO_REVIEW_ANONYMOUS_FEASIBILITY_CHECKLIST",
    safetyGates:sortedUnique([
      ...work.experiments[0].missingEvidence,
      "independent-consented-reviewer",
      "reversible-small-pilot",
      "no-private-child-data",
      "no-obligation-before-owner-agreement",
      "handling-insurance-compliance-review"
    ]),
    input:"HYPOTHETICAL_FIXTURE_ONLY",
    actualResult:"NONE",
    allowsRealDispatch:false,
    signed:false,
    identityVerified:false,
    canEnterLiveJarvis:false,
    receiptSource:"Dogram original Python used in CI only. Mathematical OK never authorizes an action."
  };
}
