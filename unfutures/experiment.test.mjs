import {test} from "node:test";
import assert from "node:assert/strict";
import {constructExperimentalEconomy,publicFieldExperimentCandidate,DOGRAM_SOURCE_PIN} from "./experiment.mjs";
import {imagine} from "./imagination.mjs";

const work=constructExperimentalEconomy();
const find=id=>work.specimens.find(s=>s.specimen_id===id);
const main=work.experiments.find(e=>e.hypothesisId==="h-pop-up-table");
const control=work.experiments.find(e=>e.hypothesisId==="h-route-table");

test("005 explicitly depends on real pinned Dogram but never makes live claims",()=>{
  assert.equal(work.environment,"SYNTHETIC_ONLY");
  assert.equal(work.dogramSource.repository,"the-static-collective/Dogram");
  assert.equal(work.dogramSource.ref,DOGRAM_SOURCE_PIN);
  assert.match(DOGRAM_SOURCE_PIN,/^[a-f0-9]{40}$/);
  assert.equal(work.specimens.length,6);
  assert.equal(work.preregistration.realInterventions,0);
  assert.equal(work.preregistration.actualVoluntaryParticipants,0);
  assert.equal(work.preregistration.externalObservations.length,0);
  assert.equal(work.admissions.execute,false);
  assert.equal(work.admissions.createRealEvidence,false);
});
test("two counterfactual hypotheses derive directly from 004, not invented scalar measurements",()=>{
  const idea=imagine();
  assert.equal(work.sourceFingerprint,idea.sourceFingerprint);
  assert.equal(work.experimentCount,2);
  for(const trial of work.experiments) {
    const source=idea.hypotheses.find(h=>h.id===trial.hypothesisId);
    assert.equal(trial.sourceHypothesisHash,source.proposalHash);
    assert.equal(trial.baselineGoalCount,source.cases.baseline.goalCount);
    assert.deepEqual(trial.outcomeCountByArm,{
      "00":source.cases.baseline.goalCount,
      "10":source.cases.recipeOnly.goalCount,
      "01":source.cases.inputOnly.goalCount,
      "11":source.cases.combined.goalCount
    });
    assert.deepEqual(trial.missingEvidence,source.evidenceRequired.sort());
    assert.equal(trial.startState,"HOLD");
    assert.equal(trial.liveCapacity,undefined);
  }
});
test("Dogram rectangle captures the nonadditive effect of recipe and extra input",()=>{
  assert.deepEqual(main.outcomeCountByArm,{"00":2,"10":2,"01":2,"11":3});
  assert.equal(main.exactInteractionExpected,1);
  assert.deepEqual(main.weightedPriorityByArm,{"00":5,"10":5,"01":5,"11":6});
  assert.equal(main.weightedInteractionExpected,1);
  const r=find("unfutures-005-main-rectangle");
  assert.equal(r.operator,"rectangle");
  assert.deepEqual(r.inputs.cells,{
    "00":{kind:"integer",value:2},
    "01":{kind:"integer",value:2},
    "10":{kind:"integer",value:2},
    "11":{kind:"integer",value:3}
  });
  assert.equal(r.schema,"dogram.specimen/v0");
  assert.equal(r.operator_version,1);
  assert.deepEqual(Object.keys(r).sort(),[
    "assumptions","inputs","metadata","operator","operator_version","schema","specimen_id"
  ]);
});
test("negative control has no fabricated gain or interaction",()=>{
  assert.deepEqual(control.outcomeCountByArm,{"00":2,"10":2,"01":2,"11":2});
  assert.equal(control.exactInteractionExpected,0);
  assert.equal(control.reasonToReject,"NO_DECLARED_GOAL_GAIN");
  const r=find("unfutures-005-control-rectangle");
  assert.ok(Object.values(r.inputs.cells).every(v=>v.kind==="integer"&&v.value===2));
});
test("Dogram delta specimen preserves ordered typed comparison",()=>{
  const d=find("unfutures-005-first-delta");
  assert.equal(d.operator,"delta");
  assert.deepEqual(d.inputs.boundary_order,["goal_count","weighted_priority"]);
  assert.deepEqual(d.inputs.left,{goal_count:{kind:"integer",value:2},
    weighted_priority:{kind:"integer",value:5}});
  assert.deepEqual(d.inputs.right,{goal_count:{kind:"integer",value:3},
    weighted_priority:{kind:"integer",value:6}});
});
test("Dogram graph specimen is a declared SERIAL path, not a logical AND proof",()=>{
  const a=find("unfutures-005-volunteer-ablate");
  const r=find("unfutures-005-bridge-reach");
  assert.equal(a.operator,"ablate");
  assert.deepEqual(a.inputs.target,{kind:"node",node:"volunteer-gate"});
  assert.deepEqual(a.inputs.requested_targets,[["recipe","goal"],["proposed-service","goal"]]);
  assert.equal(r.operator,"reach");
  assert.deepEqual(r.inputs.mutation,{op:"ADD_EDGE",source:"volunteer-gate",target:"proposed-service"});
  assert.equal(r.inputs.graph.edges.length,2);
  assert.equal(a.inputs.graph.edges.length,3);
  assert.match(a.metadata.warning,/NO CAUSAL ATTRIBUTION/);
  assert.match(r.metadata.warning,/NO CAUSAL ATTRIBUTION/);
});
test("each Dogram specimen carries exact source pin, declared assumptions and no authority",()=>{
  const ids=new Set(work.specimens.map(s=>s.specimen_id));
  assert.equal(ids.size,6);
  assert.deepEqual(new Set(work.specimens.map(s=>s.operator)),
    new Set(["rectangle","delta","reach","ablate"]));
  for(const s of work.specimens){
    assert.equal(s.metadata.dogramGitSha,DOGRAM_SOURCE_PIN);
    assert.equal(s.metadata.sourceFingerprint,work.sourceFingerprint);
    assert.equal(s.metadata.authority,"NONE");
    assert.equal(s.metadata.scope,"SYNTHETIC_ONLY");
    assert.ok(s.assumptions.length>0);
  }
});
test("candidate field experiment is a HOLD invitation only",()=>{
  const candidate=publicFieldExperimentCandidate(work);
  assert.equal(candidate.status,"DRAFT_FOR_OPERATOR_HOLD");
  assert.equal(candidate.input,"HYPOTHETICAL_FIXTURE_ONLY");
  assert.equal(candidate.notAnEnrollment,true);
  assert.equal(candidate.actualResult,"NONE");
  assert.equal(candidate.allowsRealDispatch,false);
  assert.equal(candidate.signed,false);
  assert.equal(candidate.identityVerified,false);
  assert.equal(candidate.canEnterLiveJarvis,false);
  assert.equal(candidate.ownerOfDecision,"UNSELECTED_EXTERNAL_HUMAN_STEWARD");
  assert.ok(candidate.safetyGates.includes("no-private-child-data"));
  assert.ok(candidate.safetyGates.includes("reversible-small-pilot"));
  assert.equal(candidate.sourceDogramPin,DOGRAM_SOURCE_PIN);
});
test("replaying the preparation is deterministic despite modifying copy of output",()=>{
  const copy=constructExperimentalEconomy();
  copy.experiments[0].outcomeCountByArm["11"]=99;
  assert.deepEqual(constructExperimentalEconomy(),work);
  assert.notDeepEqual(copy,work);
});
test("real or unreviewed input is strictly rejected",()=>{
  const idea=imagine();
  assert.throws(()=>constructExperimentalEconomy({...idea,environment:"LIVE"}),/held synthetic/);
  assert.throws(()=>constructExperimentalEconomy({...idea,noExecution:false}),/held synthetic/);
  assert.throws(()=>constructExperimentalEconomy({...idea,hypotheses:idea.hypotheses.slice(0,1)}),/editorial/);
  assert.throws(()=>constructExperimentalEconomy({...idea,hypotheses:idea.hypotheses.map(h=>({
    ...h,reviewStatus:"APPROVED_FOR_LIVE"
  }))}),/editorial/);
  assert.throws(()=>publicFieldExperimentCandidate({...work,environment:"LIVE"}),/Synthetic/);
});
