// UNFUTURES-004 — Economic Imagination Engine.
// Generates and tests BOUNDED, EDITORIALLY-AUTHORED recipe hypotheses;
// never inserts an unverified recipe/assumed offer into a live authority plane.
import {createHash} from "node:crypto";
import {stable} from "./engine.mjs";
import {compilePossibilities, makeGenerativeFixture} from "./generator.mjs";

const digest = obj => createHash("sha256").update(stable(obj)).digest("hex");
const validId = s => typeof s==="string" && /^[a-zA-Z0-9_.:-]{1,90}$/.test(s);
const match = (a,b) => a.town===b.town && a.resource===b.resource && a.unit===b.unit;
const positive = x => Number.isSafeInteger(x) && x>0 && x<=10000;
const compact = x => structuredClone(x);

export function editorialHypotheses() {
  const town="Waseca";
  const io=(resource,unit,quantity=1)=>({resource,unit,quantity});
  return [
    {
      id:"h-pop-up-table",source:"STATIC_EDITORIAL_TEMPLATE_V0",
      author:"fictional-idea-steward", reviewer:"fictional-independent-reviewer",
      target:"goal-table",
      question:"Could a mobile community table run with existing portable equipment and one additional volunteered shift?",
      recipe:{
        id:"09-proposed-pop-up-table",town,steward:"fictional-pop-up-steward",
        reviewer:"fictional-event-reviewer",
        inputs:[io("pots","kit"),io("battery","pack"),io("volunteer","shift")],
        outputs:[io("common_table_capacity","event")]
      },
      assumptions:[{
        id:"assume-extra-volunteer",town,resource:"volunteer",unit:"shift",
        quantity:1,owner:"FICTIONAL_UNCOMMITTED_HELPER"
      }],
      evidenceRequired:[
        "real-volunteer-consent",
        "permitted-safe-food-handling",
        "site-access-and-power-plan",
        "recipient-demand-validation"
      ],
      publicSafe:true
    },
    {
      id:"h-route-table",source:"STATIC_EDITORIAL_TEMPLATE_V0",
      author:"fictional-idea-steward",reviewer:"fictional-independent-reviewer",
      target:"goal-table",
      question:"Would another recipe competing for the existing route and shelter change the outcome?",
      recipe:{
        id:"09-proposed-route-table",town,steward:"fictional-route-steward",
        reviewer:"fictional-event-reviewer",
        inputs:[io("meal_route_capacity","route"),io("shelter","room_day"),io("pots","kit")],
        outputs:[io("common_table_capacity","event")]
      },
      assumptions:[],
      evidenceRequired:[
        "host-agreement",
        "transport-availability",
        "food-safety-protocol"
      ],
      publicSafe:true
    }
  ];
}
function validateHypotheses(fixture,candidates) {
  if(fixture?.label!=="SYNTHETIC_ONLY")throw Error("Synthetic-only imagination");
  if(!Array.isArray(candidates)||candidates.length<1||candidates.length>2)
    throw Error("Bounded authored hypotheses required");
  const goals=new Set(fixture.goals.map(g=>g.id));
  const ids=new Set();
  for(const h of candidates){
    if(!validId(h.id)||ids.has(h.id)||!goals.has(h.target)
       ||h.source!=="STATIC_EDITORIAL_TEMPLATE_V0"
       ||!validId(h.author)||!validId(h.reviewer)||h.author===h.reviewer
       ||!h.publicSafe ||typeof h.question!=="string"||h.question.length<10||h.question.length>300
       ||!h.recipe || !validId(h.recipe.id)||h.recipe.id!=="09-proposed-"+h.id.slice(2)
       ||!Array.isArray(h.assumptions)||h.assumptions.length>2
       ||!Array.isArray(h.evidenceRequired)||h.evidenceRequired.length<2
       ||h.evidenceRequired.length>8||h.evidenceRequired.some(x=>!validId(x))
       ||new Set(h.evidenceRequired).size!==h.evidenceRequired.length)
      throw Error("Invalid editorial hypothesis contract");
    ids.add(h.id);
    for(const a of h.assumptions){
      if(!validId(a.id)||!validId(a.town)||!validId(a.resource)
        ||!validId(a.unit)||!positive(a.quantity)||a.owner!=="FICTIONAL_UNCOMMITTED_HELPER")
        throw Error("Invalid hypothetical resource assumption");
    }
    // The source compiler is responsible for evaluating the full typed recipe contract.
    const f={...fixture,recipes:[...fixture.recipes,h.recipe]};
    compilePossibilities(f,{maxDepth:0,maxNodes:500});
  }
}
function simulate(fixture,h, {withRecipe=false,withAssumptions=false}={}) {
  const cloned=compact(fixture);
  if(withRecipe)cloned.recipes.push(compact(h.recipe));
  if(withAssumptions)for(const a of h.assumptions){
    cloned.inventory.push({
      id:"uncommitted:"+a.id,resource:a.resource,unit:a.unit,
      quantity:a.quantity,town:a.town,owner:a.owner
    });
  }
  const built=compilePossibilities(cloned,{maxDepth:6,maxNodes:20000});
  return {
    goalCount:built.result.goalCount,weightedPriority:built.result.weightedPriority,
    steps:built.result.steps,goals:built.result.goalIds,
    unresolved:built.result.unmet,
    trace:built.proposal.steps.map(s=>({
      id:s.id,recipeId:s.recipeId,dependencies:s.dependencies,
      outputs:s.outputs.map(o=>({resource:o.resource,unit:o.unit,quantity:o.quantity}))
    })),
    assumptionUsed:built.proposal.steps.some(s=>s.inputs.some(
      a=>a.lotId.startsWith("raw:uncommitted:"))),
    status:"SIMULATED_COUNTERFACTUAL_NOT_ADMITTED",
    realOutcomes:0
  };
}
function deficitsForRecipe(plan,recipe) {
  const remaining=plan.remainingStock;
  return recipe.inputs.map(x=>{
    const total=remaining.filter(y=>match(y,{...x,town:recipe.town}))
      .reduce((n,lot)=>n+lot.quantity,0);
    return {
      resource:x.resource,unit:x.unit,required:x.quantity,
      residualCapacity:total,shortfall:Math.max(0,x.quantity-total)
    };
  }).filter(x=>x.shortfall>0);
}
function interventions(h,baseline,cases){
  const totalBaseline=baseline.weightedPriority;
  return {
    recipeOnlyGain:cases.recipeOnly.weightedPriority-totalBaseline,
    inputOnlyGain:cases.inputOnly.weightedPriority-totalBaseline,
    combinedGain:cases.combined.weightedPriority-totalBaseline,
    needsNewInputs:cases.combined.assumptionUsed,
    contingentOnEvidence:h.evidenceRequired,
    rules:"WHAT_IF_NOT_COMMITMENT"
  };
}

export function imagine(fixture=makeGenerativeFixture(),candidates=editorialHypotheses()){
  validateHypotheses(fixture,candidates);
  const base=compilePossibilities(compact(fixture));
  const baseline={
    goalCount:base.result.goalCount,weightedPriority:base.result.weightedPriority,
    goals:base.result.goalIds,unresolved:base.result.unmet,steps:base.result.steps
  };
  const entries=[...candidates].sort((a,b)=>a.id.localeCompare(b.id)).map(h=>{
    const cases={
      baseline:simulate(fixture,h),
      recipeOnly:simulate(fixture,h,{withRecipe:true}),
      inputOnly:simulate(fixture,h,{withAssumptions:true}),
      combined:simulate(fixture,h,{withRecipe:true,withAssumptions:true})
    };
    const changes=interventions(h,baseline,cases);
    const targetGoal=fixture.goals.find(g=>g.id===h.target);
    return {
      id:h.id,author:h.author,reviewer:h.reviewer,source:h.source,
      question:h.question,target:h.target,
      proposalHash:digest(h),requirements:compact(h.recipe.inputs),
      outputs:compact(h.recipe.outputs),assumptions:compact(h.assumptions),
      evidenceRequired:[...h.evidenceRequired],
      originalGoalUnmet:baseline.unresolved.includes(h.target),
      bottlenecks:{
        selectedPlanResidual:deficitsForRecipe(base.proposal,h.recipe),
        existingRecipes:fixture.recipes.filter(r=>r.town===targetGoal.town
          &&r.outputs.some(out=>out.resource===targetGoal.requirements[0].resource
            &&out.unit===targetGoal.requirements[0].unit))
          .map(r=>({recipeId:r.id,
            missingAgainstSelectedPlan:deficitsForRecipe(base.proposal,r)}))
      },
      cases,change:changes,reviewStatus:"HOLD_EVIDENCE_AND_HUMAN_REVIEW",
      executable: false, liveCapacity:0
    };
  });
  const best=[...entries].sort((a,b)=>
    b.change.combinedGain-a.change.combinedGain||a.id.localeCompare(b.id))[0];
  return {
    schema:"unfutures.imagination-004/v0",
    environment:"SYNTHETIC_ONLY",status:"PROPOSAL_ONLY",
    baseline,sourceFingerprint:digest(fixture),
    sourceRepo:"GRAFT/UNFUTURES-003_SYNTHETIC",
    considered:entries.length,hypotheses:entries,
    suggestedForHumanReview:best.id,
    reviewPacket:{
      target:best.target,
      hypothesisId:best.id,
      gate:"NEEDS_DOMAIN_EVIDENCE_AND_VOLUNTARY_HUMAN_DECISION",
      reviewer:best.reviewer,
      questions:[
        "Can each input be confirmed by its actual owner without assuming consent?",
        "Are staffing, food safety, permissions, time and access independently feasible?",
        "Is the supposed production yield supported by a repeatable field test?",
        "What opportunity cost or displaced commitment does the new arrangement create?",
        "What contrary observation would falsify this recipe?",
        "Who can independently review a small reversible pilot before any real delivery?"
      ],
      nextAction:"DESIGN_SMALL_REVERSIBLE_TEST_NOT_DISPATCH"
    },
    noMoney:true,noTrading:true,noExecution:true,noLiveIntegration:true,
    boundary:"SCENARIO_FEASIBILITY_IS_NOT_ACTUAL_FEASIBILITY"
  };
}

export function iterateInquiry(result,{rounds=2}={}){
  if(result?.schema!=="unfutures.imagination-004/v0"
    ||result.environment!=="SYNTHETIC_ONLY")throw Error("No live inquiry");
  if(!Number.isSafeInteger(rounds)||rounds<1||rounds>3)
    throw Error("Bounded rounds required");
  const ledger=[],emitted=new Set();
  const sorted=[...result.hypotheses].sort((a,b)=>a.id.localeCompare(b.id));
  for(let round=1;round<=rounds;round++){
    for(const h of sorted) {
      const action=round===1?"QUESTION_FEASIBILITY":"QUESTION_CONFLICTS_AND_VERIFICATION";
      const id="question:"+h.id+":"+action;
      if(emitted.has(id))continue;
      emitted.add(id);
      ledger.push({
        id,round,sourceHypothesis:h.proposalHash,action,
        content:round===1
          ? h.question
          : "What evidence would overturn "+h.id+" and what already-allocated stock would it displace?",
        disposition:"HOLD_FOR_STEWARD",
        sourceStatus:"SYNTHETIC_INFERENCE",executionGrant:false
      });
    }
  }
  return {
    schema:"unfutures.inquiry-004/v0",sourceFingerprint:result.sourceFingerprint,
    rounds,questions:ledger,publication:"PROPOSE_ONLY",automaticExecution:false,
    nextRoundRequiresFreshEvidence:true
  };
}

export function toAttentionPacket(result,inquiry){
  if(result?.environment!=="SYNTHETIC_ONLY"
    ||inquiry?.sourceFingerprint!==result.sourceFingerprint)
    throw Error("Incompatible source packet");
  return {
    schema:"planz.attention-candidate.unfutures-004/v0",
    disposition:"HOLD_FOR_HUMAN_REVIEW",source:"GRAFT_SYNTHETIC_EXPERIMENT",
    sourceFingerprint:result.sourceFingerprint,
    candidates:result.hypotheses.map(h=>({
      id:h.id,sourceHash:h.proposalHash,question:h.question,
      target:h.target,estimatedWhatIfGain:h.change.combinedGain,
      evidenceMissing:[...h.evidenceRequired],
      nextHumanGate:"FEASIBILITY_AND_CONSENT_REVIEW",
      status:"UNVERIFIED_EDITORIAL_HYPOTHESIS"
    })),
    jarvisQuestions:inquiry.questions.map(q=>({
      id:q.id,sourceHypothesis:q.sourceHypothesis,question:q.content,
      disposition:q.disposition,executed:false
    })),
    canDispatch:false,canPublishAsFact:false,canMint:false,canCommit:false,
    warning:"For offline manual inspection ONLY. Not the actual planZ or JAR;VIS native contract."
  };
}

export function replayReviews(result,events,hashFn){
  if(result?.schema!=="unfutures.imagination-004/v0"
    ||typeof hashFn!=="function")throw Error("Invalid synthetic review input");
  const index=new Map(result.hypotheses.map(h=>[h.id,h]));
  const decisions=Object.fromEntries(result.hypotheses.map(h=>
    [h.id,{state:"HOLD",reviewer:null,reason:null}]));
  let head="GENESIS";
  for(let i=0;i<events.length;i++){
    const {hash,...e}=events[i],h=index.get(e.hypothesisId);
    if(!h||e.seq!==i+1||e.previous!==head
      ||e.sourceFingerprint!==result.sourceFingerprint
      ||e.hypothesisHash!==h.proposalHash||hash!==hashFn(stable(e)))
      throw Error("Review journal integrity failure");
    const state=decisions[h.id];
    if(e.action!=="REVIEW"||state.state!=="HOLD"
      ||e.actor!==h.reviewer||e.actor===h.author
      ||!["REQUEST_EVIDENCE","REJECT","ACCEPT_FOR_SYNTHETIC_TEST"].includes(e.decision)
      ||typeof e.reason!=="string"||!e.reason.trim())
      throw Error("Unauthorized or repeated review");
    state.reviewer=e.actor;state.reason=e.reason;
    state.state={
      REQUEST_EVIDENCE:"NEEDS_EVIDENCE",
      REJECT:"REJECTED",
      ACCEPT_FOR_SYNTHETIC_TEST:"SYNTHETIC_TEST_ONLY"
    }[e.decision];
    head=hash;
  }
  return {decisions,head,count:events.length,liveExecutionGrant:false};
}

export function reviewJournal(result,hashFn){
  const events=[],index=new Map(result.hypotheses.map(h=>[h.id,h]));
  return {
    events,
    append(hypothesisId,actor,decision,reason){
      const h=index.get(hypothesisId);
      if(!h)throw Error("Unknown hypothesis");
      const body={seq:events.length+1,previous:events.at(-1)?.hash??"GENESIS",
        sourceFingerprint:result.sourceFingerprint,
        hypothesisId,hypothesisHash:h.proposalHash,actor,
        action:"REVIEW",decision,reason};
      const event={...body,hash:hashFn(stable(body))};
      replayReviews(result,[...events,event],hashFn);
      events.push(event);
      return event;
    },
    snapshot:()=>replayReviews(result,events,hashFn)
  };
}
