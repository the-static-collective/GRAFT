// UNFUTURES-006 — scarcity/rounding witness preparation.
// Intentionally does not calculate or choose allocations: original Dogram Python
// performs both exact rational policies in the pinned independent source repo.
// Every input is synthetic, and every proposed allocation remains on HOLD.
import {createHash} from "node:crypto";
import {stable} from "./engine.mjs";
import {constructExperimentalEconomy,DOGRAM_SOURCE_PIN} from "./experiment.mjs";

const hash=x=>createHash("sha256").update(stable(x)).digest("hex");
const validId=x=>typeof x==="string"&&/^[A-Za-z0-9_.:-]{1,80}$/.test(x);
const METHODS=["largest_fractional_remainder","declared_order_remainder"];
const BUDGETS=[7,8,9,10];

export function makeAllocationScenario() {
  const precedent=constructExperimentalEconomy();
  return {
    schema:"unfutures.scarcity-fixture-006/v0",
    environment:"SYNTHETIC_ONLY",
    sourceExperiment:"UNFUTURES-005",
    sourceFingerprint:precedent.sourceFingerprint,
    sourceDogramPin:DOGRAM_SOURCE_PIN,
    context:"THREE_FICTIONAL_PROGRAMS_COMPETE_FOR_IDENTICAL_DISCRETE_KITS",
    resource:{resource:"general_supply_kit",unit:"kit",
      assertedTotalAtBaseline:7,
      provenance:"FICTIONAL_PROGRAMMING_FIXTURE_NOT_PHYSICAL_STOCK"},
    groups:[
      {id:"nourish",description:"Hypothetical Nourish Kids program",weight:5,
        requester:"fictional-recipient-nourish"},
      {id:"winter",description:"Hypothetical winter support program",weight:4,
        requester:"fictional-recipient-winter"},
      {id:"table",description:"Hypothetical community table program",weight:1,
        requester:"fictional-recipient-table"}
    ],
    declaredOrder:["nourish","winter","table"],
    budgets:[...BUDGETS],
    policies:[...METHODS],
    noPersonScores:true,noRealBeneficiaries:true,noMoney:true,noTrading:true,
    noActualConsent:true,authority:"NONE",state:"HOLD",
    warning:"Weights are editorial scenario parameters, not measured need or human worth."
  };
}

export function validateAllocationScenario(f) {
  if(f?.schema!=="unfutures.scarcity-fixture-006/v0"
    ||f.environment!=="SYNTHETIC_ONLY"||f.authority!=="NONE"
    ||f.state!=="HOLD"||f.noRealBeneficiaries!==true
    ||f.noActualConsent!==true||f.noMoney!==true||f.noTrading!==true
    ||f.sourceDogramPin!==DOGRAM_SOURCE_PIN)throw Error("Only inert 006 allocation fixtures");
  if(!f.resource || f.resource.unit!=="kit"
    ||f.resource.resource!=="general_supply_kit"
    ||f.resource.provenance!=="FICTIONAL_PROGRAMMING_FIXTURE_NOT_PHYSICAL_STOCK")
    throw Error("Untrusted resource class");
  if(!Array.isArray(f.groups)||f.groups.length!==3
    ||!Array.isArray(f.declaredOrder)
    ||f.declaredOrder.length!==3
    ||!Array.isArray(f.budgets)
    ||!Array.isArray(f.policies))throw Error("Wrong experiment dimensions");
  const seen=new Set();
  for(const g of f.groups){
    if(!validId(g.id)||seen.has(g.id)
      ||!Number.isSafeInteger(g.weight)||g.weight<=0||g.weight>20
      ||!validId(g.requester)||typeof g.description!=="string")
      throw Error("Invalid editorial priority weights");
    seen.add(g.id);
  }
  if(stable(f.declaredOrder)!==stable(["nourish","winter","table"])
    ||stable(f.groups.map(g=>[g.id,g.weight]))!==stable([
      ["nourish",5],["winter",4],["table",1]]))
    throw Error("Frozen allocation priority census changed");
  if(stable(f.budgets)!==stable(BUDGETS)
    ||stable(f.policies)!==stable(METHODS)
    ||f.resource.assertedTotalAtBaseline!==7)
    throw Error("Unreviewed experiment horizon or budget");
  return true;
}

export function prepareDogramAllocation(scenario=makeAllocationScenario()) {
  validateAllocationScenario(scenario);
  const sourceFingerprint=hash(scenario);
  const demands=Object.fromEntries(scenario.groups.map(g=>[g.id,g.weight]));
  const trials=scenario.budgets.flatMap(budget=>scenario.policies.map(method=>({
    id:"allocation:"+budget+":"+method,
    budget,method,weights:structuredClone(demands),
    declaredOrder:[...scenario.declaredOrder],
    expectedConservation:budget,
    inputUnit:"general_supply_kit/kit",
    state:"HOLD",
    unitAuthority:"NONE"
  })));
  return {
    schema:"unfutures.dogram-allocation-006/v0",
    environment:"SYNTHETIC_ONLY",
    sourceDogramPin:DOGRAM_SOURCE_PIN,
    source005:scenario.sourceFingerprint,
    sourceFingerprint,
    trials,
    comparison:{
      twoPolicies:[...scenario.policies],
      budgets:[...scenario.budgets],
      requireExactRationals:true,
      requireExactZeroSumResiduals:true,
      requireNoUnallocatedStock:true,
      compareZeroAssignments:true,
      requireInformationLossAudit:true,
      fairnessClaim:"NONE",
      optimizationClaim:"NONE"
    },
    candidateRules:{
      forbidAutomatedDistribution:true,
      forbidDemographicInferences:true,
      requireStakeholderReview:true,
      requireConsentFromAffectedPrograms:true,
      rejectAsLiveInventory:true
    },
    noExternalSystems:true,noActualDistribution:true,noAuthenticatedActors:true,
    meaning:"PROPORTIONAL_MATH_PRESSURE_NOT_FAIRNESS_JUDGMENT"
  };
}

export function heldDistributionCandidate(report) {
  if(report?.schema!=="unfutures.dogram-allocation-witness-006/v0"
    ||report.environment!=="SYNTHETIC_ONLY"
    ||report.dogramSourcePin!==DOGRAM_SOURCE_PIN
    ||report.actualDistributedUnits!==0
    ||report.status!=="ALL_EXACT_MATH_CHECKS_PASSED")
    throw Error("Cannot form held review from unverified math witness");
  return {
    schema:"jarvis.distribution-candidate.unfutures-006/v0",
    state:"HOLD_FOR_AFFECTED_STEWARDS",
    sourceFingerprint:report.sourceFingerprint,
    dogramSourcePin:report.dogramSourcePin,
    proposal:"Compare stated rounding constitutions before selecting any resource distribution",
    observedFixture:{
      totalOnlyMasksDifferentAllocations:report.informationLoss.lostDistinctions,
      actualDistributedUnits:0,
      zeroAssignmentWarnings:report.zeroAllocationCases.map(x=>({
        budget:x.budget,method:x.method,program:x.program
      }))
    },
    reviewGates:[
      "verify-actual-available-inventory",
      "verify-program-eligibility-and-consent",
      "reassess-editorial-weights",
      "compare-rounding-rules",
      "review-zero-allocation-and-representation",
      "define-appeals-and-exceptions",
      "do-not-distribute-before-authority"
    ],
    reviewer:"UNSELECTED",
    participantContacted:false,
    operatorDispatch:false,
    realFieldOutcome:"NONE",
    authority:"NONE"
  };
}
