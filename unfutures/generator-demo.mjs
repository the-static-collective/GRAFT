// UNFUTURES-003: offline synthetic-only recursive formation demonstration.
import {createHash} from "node:crypto";
import {makeGenerativeFixture,compilePossibilities,formationJournal,
  toCapabilityBoard,shadowOffersForReactor} from "./generator.mjs";
import {selectCycles} from "./reactor.mjs";
const hash=s=>createHash("sha256").update(s).digest("hex");
const fixture=makeGenerativeFixture(),compiled=compilePossibilities(fixture);
const plan=compiled.proposal,j=formationJournal(plan,hash);
const mode=process.argv[2]||"summary";
if(mode==="completed-board"){
  // Deliberately fictional ceremony. Actor names are strings, NOT authenticated.
  for(const actor of plan.requiredActors)
    j.append("CONSENT",actor,{decision:"YES"});
  for(const step of plan.steps){
    j.append("REPORT_STEP",step.steward,{stepId:step.id,
      note:"SIMULATED ONLY; production has not occurred"});
    j.append("CONFIRM_STEP",step.reviewer,{stepId:step.id,decision:"YES"});
  }
  for(const goal of plan.goals){
    for(const actor of goal.providers)j.append("REPORT_GOAL",actor,{
      goalId:goal.goalId,note:"SIMULATED ONLY; no delivery occurred"});
    j.append("CONFIRM_GOAL",goal.requester,{goalId:goal.goalId,decision:"YES"});
  }
}
function shadowProbe(){
  const exported=shadowOffersForReactor(compiled).find(o=>o.resource==="nourish_kids_capacity");
  if(!exported)return {cycles:0};
  const f={label:"SYNTHETIC_ONLY",towns:["Waseca","Mankato"],
    needs:[
      {id:"n1",town:"Mankato",requester:"fictional-recipient-1",
        requirements:[{resource:"nourish_kids_capacity",unit:"program",quantity:1}]},
      {id:"n2",town:"Waseca",requester:"fictional-recipient-2",
        requirements:[{resource:"coordination",unit:"packet",quantity:1}]}
    ],
    offers:[
      exported,
      {id:"paper",town:"Mankato",owner:"fictional-provider",
        resource:"coordination",unit:"packet",quantity:1,localOnly:false},
      {id:"driver-a",town:"Waseca",owner:"fictional-driver-a",resource:"transport",
        unit:"trip",quantity:1,destinations:["Mankato"],localOnly:false},
      {id:"driver-b",town:"Mankato",owner:"fictional-driver-b",resource:"transport",
        unit:"trip",quantity:1,destinations:["Waseca"],localOnly:false}
    ]};
  const found=selectCycles(f);
  return {mode:"WHAT_IF_UNVERIFIED_OUTPUTS",cycles:found.cycles.length,
    needsCovered:found.coveredNeeds,admission:"HOLD",
    note:"Reactor simulation receives a proposed output. This is NOT live inventory."};
}
let output;
if(mode==="board"||mode==="completed-board")output=toCapabilityBoard(compiled,j.snapshot());
else if(mode==="shadow")output=shadowProbe();
else if(mode==="summary")output={
  experiment:"UNFUTURES-003",environment:"SYNTHETIC_ONLY",currency:false,
  liveWork:false,connectedThirdParties:0,
  baseline:compiled.baseline,
  search:compiled.search,
  proposed:compiled.result,
  recipeChain:plan.steps.map(s=>({
    recipe:s.recipeId,dependencies:s.dependencies,
    outputs:s.outputs.map(o=>o.resource+" × "+o.quantity+" "+o.unit)
  })),
  requiredFictionalConsents:plan.requiredActors.length,
  initiallyAuthorized:false,
  realProducedGoods:0,
  realFulfilledNeeds:0,
  unrealizedToReactorShadow:shadowProbe()
};
else throw new Error("Allowed modes: summary, board, completed-board, shadow");
process.stdout.write(JSON.stringify(output,null,2)+"\n");
