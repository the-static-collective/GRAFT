import {test} from "node:test";
import assert from "node:assert/strict";
import {constructExperimentalEconomy,DOGRAM_SOURCE_PIN} from "./experiment.mjs";
import {makeAllocationScenario,validateAllocationScenario,prepareDogramAllocation,
  heldDistributionCandidate} from "./allocation.mjs";

const fixture=makeAllocationScenario();
const packet=prepareDogramAllocation(fixture);
test("006 retains real code provenance from 005 and no authority",()=>{
  assert.equal(fixture.sourceFingerprint,constructExperimentalEconomy().sourceFingerprint);
  assert.equal(packet.source005,fixture.sourceFingerprint);
  assert.equal(packet.environment,"SYNTHETIC_ONLY");
  assert.equal(packet.sourceDogramPin,DOGRAM_SOURCE_PIN);
  assert.equal(packet.comparison.fairnessClaim,"NONE");
  assert.equal(packet.comparison.optimizationClaim,"NONE");
  assert.equal(packet.noActualDistribution,true);
  assert.equal(packet.noAuthenticatedActors,true);
  assert.equal(packet.candidateRules.forbidAutomatedDistribution,true);
});
test("three programs have editorial weights, not human worth or actual inventory",()=>{
  assert.deepEqual(fixture.groups.map(g=>[g.id,g.weight]),[
    ["nourish",5],["winter",4],["table",1]
  ]);
  assert.equal(fixture.resource.assertedTotalAtBaseline,7);
  assert.equal(fixture.resource.unit,"kit");
  assert.equal(fixture.noRealBeneficiaries,true);
  assert.equal(fixture.noPersonScores,true);
  assert.equal(fixture.resource.provenance,"FICTIONAL_PROGRAMMING_FIXTURE_NOT_PHYSICAL_STOCK");
});
test("native Python will receive 8 exact, bounded, explicit requests",()=>{
  assert.equal(packet.trials.length,8);
  const names=new Set(packet.trials.map(x=>x.id));
  assert.equal(names.size,8);
  for(const t of packet.trials){
    assert.ok([7,8,9,10].includes(t.budget));
    assert.ok(["largest_fractional_remainder","declared_order_remainder"].includes(t.method));
    assert.deepEqual(t.weights,{nourish:5,winter:4,table:1});
    assert.deepEqual(t.declaredOrder,["nourish","winter","table"]);
    assert.equal(t.expectedConservation,t.budget);
    assert.equal(t.state,"HOLD");
    assert.equal(t.unitAuthority,"NONE");
  }
});
test("order changes cannot silently change the source census",()=>{
  assert.throws(()=>prepareDogramAllocation({...fixture,
    groups:[...fixture.groups].reverse()}),/priority census/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    declaredOrder:["table","nourish","winter"]}),/priority census/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    budgets:[7,8,9]}),/horizon/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    policies:["largest_fractional_remainder"]}),/horizon/);
});
test("hostile inputs are refused before exact original-Dogram processing",()=>{
  assert.throws(()=>prepareDogramAllocation({...fixture,
    environment:"LIVE"}),/inert/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    authority:"DISPATCH"}),/inert/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    noActualConsent:false}),/inert/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    sourceDogramPin:"moving/main"}),/inert/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    noMoney:false}),/inert/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    resource:{...fixture.resource,resource:"transferable_token"}}),/resource class/);
  assert.throws(()=>prepareDogramAllocation({...fixture,
    groups:fixture.groups.map((g,i)=>i===0?{...g,weight:0}:g)}),/weights/);
});
test("frozen scenario exactly replays byte-identically, without source mutation",()=>{
  const initial=JSON.stringify(fixture);
  const second=prepareDogramAllocation(fixture);
  assert.deepEqual(second,packet);
  assert.equal(JSON.stringify(fixture),initial);
  assert.match(packet.sourceFingerprint,/^[0-9a-f]{64}$/);
});
test("a future native witness can only produce a held candidate, not an allocation",()=>{
  const proof={
    schema:"unfutures.dogram-allocation-witness-006/v0",
    environment:"SYNTHETIC_ONLY",dogramSourcePin:DOGRAM_SOURCE_PIN,
    sourceFingerprint:packet.sourceFingerprint,
    status:"ALL_EXACT_MATH_CHECKS_PASSED",actualDistributedUnits:0,
    informationLoss:{lostDistinctions:3},
    zeroAllocationCases:[
      {budget:7,method:"declared_order_remainder",program:"table"},
      {budget:8,method:"declared_order_remainder",program:"table"},
      {budget:9,method:"declared_order_remainder",program:"table"}
    ]
  };
  const review=heldDistributionCandidate(proof);
  assert.equal(review.state,"HOLD_FOR_AFFECTED_STEWARDS");
  assert.equal(review.operatorDispatch,false);
  assert.equal(review.participantContacted,false);
  assert.equal(review.realFieldOutcome,"NONE");
  assert.equal(review.observedFixture.totalOnlyMasksDifferentAllocations,3);
  assert.equal(review.observedFixture.zeroAssignmentWarnings.length,3);
  assert.ok(review.reviewGates.includes("review-zero-allocation-and-representation"));
  assert.equal(review.authority,"NONE");
  assert.throws(()=>heldDistributionCandidate({...proof,actualDistributedUnits:1}),/Cannot form/);
  assert.throws(()=>heldDistributionCandidate({...proof,status:"UNCHECKED"}),/Cannot form/);
});
test("candidate cannot mint, claim an available kit or commit a real person",()=>{
  assert.equal(packet.noExternalSystems,true);
  assert.equal(packet.noActualDistribution,true);
  assert.equal(packet.candidateRules.rejectAsLiveInventory,true);
  assert.equal(packet.candidateRules.requireConsentFromAffectedPrograms,true);
  assert.equal(packet.candidateRules.forbidDemographicInferences,true);
});
