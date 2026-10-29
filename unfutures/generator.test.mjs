import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {makeGenerativeFixture,validateGenerativeFixture,compilePossibilities,
  replayFormation,formationJournal,toCapabilityBoard,shadowOffersForReactor
} from "./generator.mjs";
import {selectCycles} from "./reactor.mjs";
const sha256=s=>createHash("sha256").update(s).digest("hex");
const fixture=makeGenerativeFixture();
const compiled=compilePossibilities(fixture);
const plan=compiled.proposal;
function fullyConsent(j){
  for(const actor of plan.requiredActors) j.append("CONSENT",actor,{decision:"YES"});
}
function completePlan(j){
  fullyConsent(j);
  for(const step of plan.steps){
    j.append("REPORT_STEP",step.steward,{stepId:step.id,note:"SYNTHETIC ONLY"});
    j.append("CONFIRM_STEP",step.reviewer,{stepId:step.id,decision:"YES"});
  }
  for(const goal of plan.goals){
    for(const provider of goal.providers)
      j.append("REPORT_GOAL",provider,{goalId:goal.goalId,note:"SYNTHETIC ONLY"});
    j.append("CONFIRM_GOAL",goal.requester,{goalId:goal.goalId,decision:"YES"});
  }
  return j.snapshot();
}
test("fixture is bounded, typed and synthetic-only",()=>{
  assert.equal(fixture.label,"SYNTHETIC_ONLY");
  assert.equal(fixture.towns.length,1);
  assert.equal(fixture.inventory.length,11);
  assert.equal(fixture.recipes.length,8);
  assert.equal(fixture.goals.length,3);
  assert.equal(validateGenerativeFixture(fixture),true);
  assert.throws(()=>compilePossibilities({...fixture,label:"LIVE"}),/synthetic/);
});
test("recursive assembly grows a new capability from existing offers",()=>{
  assert.equal(compiled.baseline.count,0);
  assert.equal(compiled.result.goalCount,2);
  assert.equal(compiled.result.weightedPriority,5);
  assert.deepEqual(compiled.result.goalIds,["goal-nourish","goal-winter"]);
  assert.deepEqual(compiled.result.unmet,["goal-table"]);
  assert.equal(compiled.result.steps,5);
  assert.deepEqual(plan.steps.map(s=>s.recipeId),
    ["01-pack-meals","03-create-route","04-nourish-kids","05-make-heat-kit","06-winter-support"]
  );
  assert.equal(plan.status,"HOLD");
  assert.equal(plan.executedSteps,0);
  assert.equal(plan.verifiedFieldOutcomes,0);
});
test("maxDepth bounds recursion and does not silently invent future offers",()=>{
  const none=compilePossibilities(fixture,{maxDepth:0});
  assert.equal(none.result.goalCount,0);
  assert.equal(none.proposal.proposedOutputs.length,0);
  const shallow=compilePossibilities(fixture,{maxDepth:2});
  assert.equal(shallow.result.goalCount,1);
  assert.deepEqual(shallow.result.goalIds,["goal-winter"]);
  const short=compilePossibilities(fixture,{maxDepth:4});
  assert.equal(short.result.goalCount,1);
  const full=compilePossibilities(fixture,{maxDepth:5});
  assert.equal(full.result.goalCount,2);
});
test("recipe ordering cannot change deterministic best plan",()=>{
  const reorder={...fixture,recipes:[...fixture.recipes].reverse(),
    inventory:[...fixture.inventory].reverse(),goals:[...fixture.goals].reverse()};
  assert.deepEqual(compilePossibilities(reorder).proposal,plan);
  assert.deepEqual(compilePossibilities(fixture),compiled);
});
test("lineage is acyclic, strictly backward-looking and conserves all stock",()=>{
  const usedStep=new Set();
  const origin=new Map(fixture.inventory.map(x=>["raw:"+x.id,x.quantity]));
  const remaining=new Map(origin);
  for(const step of plan.steps){
    for(const dependency of step.dependencies)assert.ok(usedStep.has(dependency));
    for(const a of step.inputs){
      assert.ok(remaining.has(a.lotId),"missing created origin "+a.lotId);
      assert.ok(remaining.get(a.lotId)>=a.quantity,"overspend "+a.lotId);
      remaining.set(a.lotId,remaining.get(a.lotId)-a.quantity);
    }
    const recipe=fixture.recipes.find(r=>r.id===step.recipeId);
    assert.equal(recipe.outputs.length,step.outputs.length);
    for(const o of step.outputs){
      assert.ok(!remaining.has(o.id));
      assert.ok(recipe.outputs.some(r=>r.resource===o.resource&&r.unit===o.unit
        &&r.quantity===o.quantity));
      remaining.set(o.id,o.quantity);
    }
    usedStep.add(step.id);
  }
  for(const goal of plan.goals)for(const a of goal.allocations){
    assert.ok(remaining.get(a.lotId)>=a.quantity);
    remaining.set(a.lotId,remaining.get(a.lotId)-a.quantity);
  }
  assert.equal(new Set(plan.steps.map(x=>x.id)).size,5);
  assert.ok(plan.steps.some(s=>s.dependencies.length>0));
});
test("scarce van and shelter cannot be allocated into overlapping promised programs",()=>{
  const allPossible=["goal-nourish","goal-winter","goal-table"];
  assert.equal(plan.goals.length,2);
  assert.ok(allPossible.includes(plan.unmet[0]));
  const routeOutput=plan.proposedOutputs.find(o=>o.resource==="meal_route_capacity");
  assert.ok(routeOutput);
  assert.ok(plan.steps.some(s=>s.inputs.some(a=>a.lotId===routeOutput.id)));
  assert.equal(plan.steps.filter(s=>s.inputs.some(a=>a.lotId==="raw:supply-van")).length,1);
  assert.equal(plan.steps.filter(s=>s.inputs.some(a=>a.lotId==="raw:supply-shelter")).length,1);
});
test("uncertain production assumptions cannot be treated as actual resource stock",()=>{
  const board=toCapabilityBoard(compiled);
  assert.equal(board.status,"HOLD");
  assert.equal(board.goals.every(g=>!g.confirmedInSimulation),true);
  assert.equal(board.steps.every(s=>s.outputs.every(o=>o.proposed)),true);
  assert.equal(board.noActualPermissions,true);
  assert.equal(board.noTrading,true);
  assert.equal(board.noMoney,true);
  const output=shadowOffersForReactor(compiled);
  assert.equal(output.length,2); // Only terminal lots; intermediate outputs were consumed.
  assert.ok(output.every(o=>o.status==="UNVERIFIED_PROPOSED_OUTPUT"&&o.admission==="HOLD"));
  assert.ok(output.every(o=>o.transferAuthority===false&&o.liveInventory===false));
  assert.ok(output.every(o=>o.conflictsWithGoals.length===1));
});
test("typed units matter and incompatible chain stops at missing input",()=>{
  const corrupted={...fixture,inventory:fixture.inventory.map(x=>x.resource==="van"
    ? {...x,unit:"meter"}:x)};
  const result=compilePossibilities(corrupted);
  assert.equal(result.proposal.goals.some(g=>g.goalId==="goal-nourish"),false);
  assert.deepEqual(result.result.goalIds,["goal-winter"]);
});
test("an unseeded transformation loop cannot create an arbitrary new good",()=>{
  const cyclic={...fixture,
    recipes:[...fixture.recipes,
      {id:"09-impossible-a",town:"Waseca",steward:"elf-a",reviewer:"witness-a",
       inputs:[{resource:"future-b",unit:"item",quantity:1}],
       outputs:[{resource:"future-a",unit:"item",quantity:1}]},
      {id:"10-impossible-b",town:"Waseca",steward:"elf-b",reviewer:"witness-b",
       inputs:[{resource:"future-a",unit:"item",quantity:1}],
       outputs:[{resource:"future-b",unit:"item",quantity:1}]}],
    goals:[...fixture.goals,
      {id:"goal-impossible",town:"Waseca",requester:"receiver-impossible",
       priority:10,requirements:[{resource:"future-a",unit:"item",quantity:1}]}]};
  const result=compilePossibilities(cyclic);
  assert.ok(result.result.unmet.includes("goal-impossible"));
  assert.equal(result.result.goalCount,2);
});
test("self-feeding and zero-input recipes are rejected",()=>{
  const impossible={id:"09-self",town:"Waseca",steward:"steward-a",reviewer:"reviewer-b",
    inputs:[{resource:"energy",unit:"unit",quantity:1}],
    outputs:[{resource:"energy",unit:"unit",quantity:2}]};
  assert.throws(()=>validateGenerativeFixture({...fixture,
    recipes:[...fixture.recipes,impossible]}),/self-feeding/);
  assert.throws(()=>validateGenerativeFixture({...fixture,
    recipes:[...fixture.recipes,{...impossible,inputs:[]}]}),/recipe/);
  assert.throws(()=>compilePossibilities(fixture,{maxDepth:20}),/bounded/);
  assert.throws(()=>compilePossibilities(fixture,{maxNodes:1}),/bounded/);
});
test("only full synthetic multi-actor consent enters COMMITTED",()=>{
  const j=formationJournal(plan,sha256);
  assert.ok(plan.requiredActors.includes("owner-farm"));
  assert.ok(plan.requiredActors.includes("recipient-families"));
  assert.ok(plan.requiredActors.includes("reviewer-family"));
  assert.ok(plan.requiredActors.length>12);
  for(const actor of plan.requiredActors.slice(0,-1))
    j.append("CONSENT",actor,{decision:"YES"});
  assert.equal(j.snapshot().status,"HOLD");
  const first=plan.steps[0];
  assert.throws(()=>j.append("REPORT_STEP",first.steward,
    {stepId:first.id,note:"too early"}),/report/);
  j.append("CONSENT",plan.requiredActors.at(-1),{decision:"YES"});
  assert.equal(j.snapshot().status,"COMMITTED");
  assert.throws(()=>j.append("CONSENT",plan.requiredActors[0],{decision:"YES"}),/consent/);
});
test("one refusal blocks the entire assembly, even if other people agree",()=>{
  const j=formationJournal(plan,sha256);
  j.append("CONSENT",plan.requiredActors[0],{decision:"NO"});
  assert.equal(j.snapshot().status,"REFUSED");
  assert.throws(()=>j.append("CONSENT",plan.requiredActors[1],{decision:"YES"}),/consent/);
});
test("a participant can withdraw until the first work report",()=>{
  const j=formationJournal(plan,sha256);
  fullyConsent(j);
  j.append("WITHDRAW",plan.requiredActors[0]);
  assert.equal(j.snapshot().status,"CANCELLED");
  assert.throws(()=>j.append("REPORT_STEP",plan.steps[0].steward,
    {stepId:plan.steps[0].id,note:"too late"}),/report/);
  const k=formationJournal(plan,sha256);fullyConsent(k);
  k.append("REPORT_STEP",plan.steps[0].steward,
    {stepId:plan.steps[0].id,note:"fixture"});
  assert.throws(()=>k.append("WITHDRAW",plan.requiredActors[0]),/dispute review/);
});
test("downstream production cannot report until verified upstream synthetic steps",()=>{
  const j=formationJournal(plan,sha256);fullyConsent(j);
  const dependent=plan.steps.find(s=>s.dependencies.length>0);
  assert.ok(dependent);
  assert.throws(()=>j.append("REPORT_STEP",dependent.steward,
    {stepId:dependent.id,note:"premature"}),/report/);
  for(const dep of dependent.dependencies){
    const prerequisite=plan.steps.find(s=>s.id===dep);
    j.append("REPORT_STEP",prerequisite.steward,
      {stepId:prerequisite.id,note:"fixture"});
    assert.throws(()=>j.append("CONFIRM_STEP",prerequisite.steward,
      {stepId:prerequisite.id,decision:"YES"}),/confirmation/);
    j.append("CONFIRM_STEP",prerequisite.reviewer,{stepId:prerequisite.id,decision:"YES"});
  }
  j.append("REPORT_STEP",dependent.steward,{stepId:dependent.id,note:"fixture"});
  assert.equal(j.snapshot().status,"IN_PROGRESS");
});
test("report is not independent receipt; all goals must be confirmed for synthetic completion",()=>{
  const j=formationJournal(plan,sha256);fullyConsent(j);
  for(const step of plan.steps){
    j.append("REPORT_STEP",step.steward,{stepId:step.id,note:"fixture"});
    j.append("CONFIRM_STEP",step.reviewer,{stepId:step.id,decision:"YES"});
  }
  const first=plan.goals[0];
  assert.throws(()=>j.append("CONFIRM_GOAL",first.requester,
    {goalId:first.goalId,decision:"YES"}),/goal confirmation/);
  for(const provider of first.providers)
    j.append("REPORT_GOAL",provider,{goalId:first.goalId,note:"fixture"});
  assert.throws(()=>j.append("CONFIRM_GOAL",first.providers[0],
    {goalId:first.goalId,decision:"YES"}),/goal confirmation/);
  j.append("CONFIRM_GOAL",first.requester,{goalId:first.goalId,decision:"YES"});
  assert.equal(j.snapshot().status,"IN_PROGRESS");
  for(const goal of plan.goals.slice(1)){
    for(const provider of goal.providers)
      j.append("REPORT_GOAL",provider,{goalId:goal.goalId,note:"fixture"});
    j.append("CONFIRM_GOAL",goal.requester,{goalId:goal.goalId,decision:"YES"});
  }
  assert.equal(j.snapshot().status,"CONFIRMED");
  const board=toCapabilityBoard(compiled,j.snapshot());
  assert.equal(board.status,"CONFIRMED");
  assert.equal(board.goals.every(g=>g.confirmedInSimulation),true);
  assert.equal(board.steps.every(s=>s.confirmedInSimulation),true);
  assert.equal(board.environment,"SYNTHETIC_ONLY");
});
test("full replay, plan-fingerprint and event-sequence integrity",()=>{
  const j=formationJournal(plan,sha256);
  const state=completePlan(j);
  assert.equal(state.status,"CONFIRMED");
  assert.ok(state.eventCount>25);
  assert.match(state.head,/^[a-f0-9]{64}$/);
  assert.deepEqual(replayFormation(plan,j.events,sha256),state);
  assert.throws(()=>replayFormation(plan,[{...j.events[0],decision:"NO"},...j.events.slice(1)],sha256),/integrity/);
  assert.throws(()=>replayFormation(plan,[{...j.events[0],seq:10},...j.events.slice(1)],sha256),/integrity/);
  const altered={...plan,goals:plan.goals.map((g,i)=>i===0?{...g,quantity:500}:g)};
  assert.throws(()=>replayFormation(altered,j.events,sha256),/integrity/);
  assert.throws(()=>j.append("CONSENT",plan.requiredActors[0],
    {seq:100,decision:"YES"}),/event fields/);
});
test("002 reactor can inspect proposed capabilities ONLY in a clearly fictional shadow world",()=>{
  const candidates=shadowOffersForReactor(compiled);
  const exported=candidates.find(o=>o.resource==="nourish_kids_capacity");
  assert.ok(exported);
  const shadowWorld={label:"SYNTHETIC_ONLY",towns:["Waseca","Mankato"],
    needs:[
      {id:"n1",town:"Mankato",requester:"receiver-2",requirements:[
        {resource:"nourish_kids_capacity",unit:"program",quantity:1}]},
      {id:"n2",town:"Waseca",requester:"receiver-1",requirements:[
        {resource:"paperwork",unit:"packet",quantity:1}]}
    ],
    offers:[
      exported,
      {id:"other-material",town:"Mankato",owner:"paper-owner",resource:"paperwork",
       unit:"packet",quantity:1,localOnly:false},
      {id:"carrier-a",town:"Waseca",owner:"driver-a",resource:"transport",
       unit:"trip",quantity:1,destinations:["Mankato"],localOnly:false},
      {id:"carrier-b",town:"Mankato",owner:"driver-b",resource:"transport",
       unit:"trip",quantity:1,destinations:["Waseca"],localOnly:false}
    ]
  };
  const probe=selectCycles(shadowWorld);
  assert.equal(probe.coveredNeeds,2);
  assert.equal(probe.cycles.length,1);
  assert.equal(exported.status,"UNVERIFIED_PROPOSED_OUTPUT");
  assert.equal(exported.admission,"HOLD");
  // This proves an executable what-if data crossing, not a receipted 002 allocation.
});

test("a direct, already-present synthetic good can be reported with no recipe steps",()=>{
  const direct={...fixture,recipes:[],goals:[
    {id:"goal-produce",town:"Waseca",requester:"receiver-produce",priority:1,
      requirements:[{resource:"produce",unit:"crate",quantity:3}]}
  ]};
  const result=compilePossibilities(direct);
  assert.equal(result.result.goalCount,1);
  assert.equal(result.proposal.steps.length,0);
  const j=formationJournal(result.proposal,sha256);
  for(const actor of result.proposal.requiredActors)
    j.append("CONSENT",actor,{decision:"YES"});
  j.append("REPORT_GOAL","owner-farm",{goalId:"goal-produce",note:"SYNTHETIC"});
  assert.equal(j.snapshot().status,"IN_PROGRESS");
  j.append("CONFIRM_GOAL","receiver-produce",
    {goalId:"goal-produce",decision:"YES"});
  assert.equal(j.snapshot().status,"CONFIRMED");
});
test("hypothetical downstream offers explicitly conflict with already-allocated goals",()=>{
  const shadow=shadowOffersForReactor(compiled);
  const ids=new Set(compiled.proposal.goals.map(g=>g.goalId));
  for(const offered of shadow){
    assert.equal(offered.admission,"HOLD");
    assert.ok(offered.conflictsWithGoals.every(id=>ids.has(id)));
  }
  assert.ok(shadow.some(o=>o.conflictsWithGoals.includes("goal-nourish")));
  assert.ok(shadow.some(o=>o.conflictsWithGoals.includes("goal-winter")));
  assert.equal(shadow.some(o=>o.resource==="meal_boxes"),false);
  assert.equal(shadow.some(o=>o.resource==="meal_route_capacity"),false);
});
