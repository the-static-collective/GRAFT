import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  editorialHypotheses,imagine,iterateInquiry,toAttentionPacket,
  reviewJournal,replayReviews
} from "./imagination.mjs";
import {makeGenerativeFixture} from "./generator.mjs";
const hash=s=>createHash("sha256").update(s).digest("hex");
const fixture=makeGenerativeFixture();
const templates=editorialHypotheses();
const run=imagine(fixture,templates);
const pop=run.hypotheses.find(h=>h.id==="h-pop-up-table");
const route=run.hypotheses.find(h=>h.id==="h-route-table");
test("source and candidates remain synthetic and source-attributable",()=>{
  assert.equal(run.environment,"SYNTHETIC_ONLY");
  assert.equal(run.schema,"unfutures.imagination-004/v0");
  assert.equal(run.considered,2);
  assert.equal(run.baseline.goalCount,2);
  assert.equal(run.baseline.weightedPriority,5);
  assert.equal(run.noExecution,true);
  assert.equal(run.noLiveIntegration,true);
  assert.equal(run.noMoney,true);
  assert.equal(run.noTrading,true);
  assert.match(run.sourceFingerprint,/^[0-9a-f]{64}$/);
  for(const h of run.hypotheses){
    assert.match(h.proposalHash,/^[0-9a-f]{64}$/);
    assert.equal(h.reviewStatus,"HOLD_EVIDENCE_AND_HUMAN_REVIEW");
    assert.equal(h.liveCapacity,0);
    assert.equal(h.executable,false);
    assert.equal(h.source,"STATIC_EDITORIAL_TEMPLATE_V0");
  }
});
test("original fixture and template objects are immutable across what-if evaluation",()=>{
  const before=JSON.stringify({fixture,templates});
  const second=imagine(fixture,templates);
  assert.equal(JSON.stringify({fixture,templates}),before);
  assert.deepEqual(second,run);
});
test("separates original, recipe-only, staffing-only and combined scenarios",()=>{
  assert.equal(pop.cases.baseline.goalCount,2);
  assert.equal(pop.cases.recipeOnly.goalCount,2);
  assert.equal(pop.cases.inputOnly.goalCount,2);
  assert.equal(pop.cases.combined.goalCount,3);
  assert.equal(pop.cases.combined.weightedPriority,6);
  assert.ok(pop.cases.combined.goals.includes("goal-table"));
  assert.equal(pop.change.recipeOnlyGain,0);
  assert.equal(pop.change.inputOnlyGain,0);
  assert.equal(pop.change.combinedGain,1);
  assert.equal(pop.cases.combined.assumptionUsed,true);
  assert.equal(pop.cases.combined.status,"SIMULATED_COUNTERFACTUAL_NOT_ADMITTED");
  assert.equal(pop.cases.combined.realOutcomes,0);
  assert.equal(pop.cases.recipeOnly.assumptionUsed,false);
});
test("finds specific shortage rather than imagining new volunteer as real",()=>{
  const missing=pop.bottlenecks.selectedPlanResidual;
  assert.deepEqual(missing,[{
    resource:"volunteer",unit:"shift",required:1,residualCapacity:0,shortfall:1
  }]);
  assert.equal(pop.assumptions.length,1);
  assert.equal(pop.assumptions[0].owner,"FICTIONAL_UNCOMMITTED_HELPER");
  assert.ok(pop.evidenceRequired.includes("real-volunteer-consent"));
  assert.ok(pop.evidenceRequired.includes("permitted-safe-food-handling"));
  assert.ok(pop.bottlenecks.existingRecipes[0].missingAgainstSelectedPlan
    .some(x=>x.resource==="shelter"));
});
test("nonimproving alternative not misrepresented as innovation",()=>{
  assert.equal(route.cases.recipeOnly.weightedPriority,run.baseline.weightedPriority);
  assert.equal(route.cases.combined.weightedPriority,run.baseline.weightedPriority);
  assert.equal(route.change.combinedGain,0);
  assert.equal(route.assumptions.length,0);
  assert.equal(run.suggestedForHumanReview,"h-pop-up-table");
  assert.equal(run.reviewPacket.gate,"NEEDS_DOMAIN_EVIDENCE_AND_VOLUNTARY_HUMAN_DECISION");
});
test("no input or recipe is admitted by a suggestion",()=>{
  assert.equal(fixture.inventory.length,11);
  assert.equal(fixture.recipes.length,8);
  assert.equal(run.hypotheses.every(h=>!h.executable&&h.liveCapacity===0),true);
  assert.equal(run.reviewPacket.nextAction,"DESIGN_SMALL_REVERSIBLE_TEST_NOT_DISPATCH");
});
test("authored input must pass bounds and cannot impersonate non-synthetic source",()=>{
  assert.throws(()=>imagine({...fixture,label:"LIVE"}),/synthetic/i);
  assert.throws(()=>imagine(fixture,[]),/Bounded/);
  assert.throws(()=>imagine(fixture,[...templates,...templates]),/Bounded/);
  assert.throws(()=>imagine(fixture,[templates[0],templates[0]]),/Invalid/);
  assert.throws(()=>imagine(fixture,[{...templates[0],source:"MODEL_CONFIDENT"}]),/Invalid/);
  assert.throws(()=>imagine(fixture,[{...templates[0],reviewer:templates[0].author}]),/Invalid/);
  assert.throws(()=>imagine(fixture,[{...templates[0],evidenceRequired:[]}]),/Invalid/);
  assert.throws(()=>imagine(fixture,[{...templates[0],assumptions:[
    {...templates[0].assumptions[0],quantity:0}
  ]}]),/Invalid/);
  assert.throws(()=>imagine(fixture,[{...templates[0],recipe:{
    ...templates[0].recipe,inputs:[]
  }}]),/Invalid/);
});
test("question loop is bounded and stable; second pass asks different questions",()=>{
  const once=iterateInquiry(run,{rounds:1});
  const twice=iterateInquiry(run,{rounds:2});
  assert.equal(once.questions.length,2);
  assert.equal(twice.questions.length,4);
  assert.equal(twice.questions.filter(x=>x.round===2).length,2);
  assert.ok(twice.questions.every(x=>x.disposition==="HOLD_FOR_STEWARD"));
  assert.ok(twice.questions.every(x=>x.executionGrant===false));
  assert.deepEqual(iterateInquiry(run,{rounds:2}),twice);
  assert.equal(twice.nextRoundRequiresFreshEvidence,true);
  assert.throws(()=>iterateInquiry(run,{rounds:9}),/Bounded/);
});
test("read-only attention packet preserves source and is never native planZ authority",()=>{
  const loop=iterateInquiry(run,{rounds:2});
  const packet=toAttentionPacket(run,loop);
  assert.equal(packet.disposition,"HOLD_FOR_HUMAN_REVIEW");
  assert.equal(packet.candidates.length,2);
  assert.equal(packet.jarvisQuestions.length,4);
  assert.equal(packet.canDispatch,false);
  assert.equal(packet.canCommit,false);
  assert.equal(packet.canPublishAsFact,false);
  assert.ok(packet.candidates.every(x=>x.status==="UNVERIFIED_EDITORIAL_HYPOTHESIS"));
  assert.throws(()=>toAttentionPacket(run,{...loop,sourceFingerprint:"fake"}),/Incompatible/);
});
test("a reviewer may choose synthetic testing; no decision creates execution rights",()=>{
  const j=reviewJournal(run,hash);
  const first=run.hypotheses[0];
  assert.throws(()=>j.append(first.id,first.author,"ACCEPT_FOR_SYNTHETIC_TEST","yes"),/Unauthorized/);
  assert.equal(j.events.length,0);
  j.append(first.id,first.reviewer,"ACCEPT_FOR_SYNTHETIC_TEST","Explore fictional evidence");
  const state=j.snapshot();
  assert.equal(state.decisions[first.id].state,"SYNTHETIC_TEST_ONLY");
  assert.equal(state.liveExecutionGrant,false);
  assert.match(state.head,/^[0-9a-f]{64}$/);
  assert.throws(()=>j.append(first.id,first.reviewer,"REJECT","new answer"),/repeated/);
});
test("veto, request-evidence and refusal work without silently selecting a different plan",()=>{
  const j=reviewJournal(run,hash);
  const [a,b]=run.hypotheses;
  j.append(a.id,a.reviewer,"REQUEST_EVIDENCE","Need documented safety constraints");
  j.append(b.id,b.reviewer,"REJECT","Cannot preserve shelter capacity");
  assert.equal(j.snapshot().decisions[a.id].state,"NEEDS_EVIDENCE");
  assert.equal(j.snapshot().decisions[b.id].state,"REJECTED");
  assert.equal(j.snapshot().liveExecutionGrant,false);
});
test("review journal rejects forged content, sequence, source, and changed proposal",()=>{
  const j=reviewJournal(run,hash), h=run.hypotheses[0];
  j.append(h.id,h.reviewer,"REJECT","Not ready");
  assert.equal(replayReviews(run,j.events,hash).count,1);
  assert.throws(()=>replayReviews(run,[{...j.events[0],decision:"ACCEPT_FOR_SYNTHETIC_TEST"}],hash),/integrity/);
  assert.throws(()=>replayReviews(run,[{...j.events[0],seq:2}],hash),/integrity/);
  const mutation={...run,hypotheses:run.hypotheses.map(x=>x.id===h.id
    ?{...x,proposalHash:"fake"}:x)};
  assert.throws(()=>replayReviews(mutation,j.events,hash),/integrity/);
  assert.throws(()=>j.append(h.id,h.reviewer,"EXECUTE","Try it"),/repeated/);
});
