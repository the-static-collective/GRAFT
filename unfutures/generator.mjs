// UNFUTURES-003 · The Generative Economy.
// Bounded, offline, synthetic-only recipe planning; NO actual production,
// authority, partner, money, market, wallet, or external service.
import {stable} from "./engine.mjs";
const isId = x => typeof x === "string" && /^[A-Za-z0-9_.:-]{1,90}$/.test(x);
const positive = x => Number.isSafeInteger(x) && x > 0;
const sortId = (a,b) => a.id.localeCompare(b.id);
const same = (a,b) => a.resource===b.resource && a.unit===b.unit && a.town===b.town;
function specError(message) {throw new Error("Invalid synthetic specification: " + message);}

export function makeGenerativeFixture() {
  const town="Waseca";
  const inventory=[
    ["produce", "crate", 6, "farm"],
    ["kitchen", "shift", 1, "kitchen"],
    ["volunteer", "shift", 3, "helpers"],
    ["van", "vehicle_day", 1, "transport"],
    ["roster", "registry", 1, "organizer"],
    ["firewood", "bundle", 3, "woods"],
    ["insulation", "sheet", 2, "supplies"],
    ["tools", "kit", 1, "workshop"],
    ["shelter", "room_day", 1, "host"],
    ["battery", "pack", 1, "maker"],
    ["pots", "kit", 1, "cookware"]
  ].map(([resource,unit,quantity,owner])=>({
    id:"supply-"+resource,town,resource,unit,quantity,owner:"owner-"+owner
  }));
  const io = (resource,unit,quantity=1)=>({resource,unit,quantity});
  const recipe = (id, inputs, outputs, steward, reviewer) => ({
    id,town,inputs,outputs,steward,reviewer
  });
  const recipes=[
    recipe("01-pack-meals",
      [io("produce","crate",6),io("kitchen","shift"),io("volunteer","shift")],
      [io("meal_boxes","box",12)],"steward-kitchen","reviewer-food"),
    recipe("02-pack-alternate",
      [io("produce","crate",6),io("kitchen","shift"),io("volunteer","shift",2),io("pots","kit")],
      [io("meal_boxes","box",12)],"steward-soup","reviewer-food"),
    recipe("03-create-route",
      [io("meal_boxes","box",12),io("van","vehicle_day"),io("volunteer","shift")],
      [io("meal_route_capacity","route")],"steward-route","reviewer-logistics"),
    recipe("04-nourish-kids",
      [io("meal_route_capacity","route"),io("roster","registry")],
      [io("nourish_kids_capacity","program")],"steward-nourish","reviewer-family"),
    recipe("05-make-heat-kit",
      [io("firewood","bundle",3),io("insulation","sheet",2),io("tools","kit")],
      [io("heat_readiness_kit","kit")],"steward-thermal","reviewer-safety"),
    recipe("06-winter-support",
      [io("heat_readiness_kit","kit"),io("shelter","room_day"),io("volunteer","shift")],
      [io("winter_support_capacity","program")],"steward-winter","reviewer-community"),
    recipe("07-battery-warming",
      [io("battery","pack"),io("shelter","room_day"),io("volunteer","shift",2)],
      [io("winter_support_capacity","program")],"steward-battery","reviewer-safety"),
    recipe("08-common-table",
      [io("meal_route_capacity","route"),io("shelter","room_day")],
      [io("common_table_capacity","event")],"steward-table","reviewer-community")
  ];
  return {
    label:"SYNTHETIC_ONLY", towns:[town], inventory, recipes,
    goals:[
      {id:"goal-nourish",town,requester:"recipient-families",priority:3,
        requirements:[io("nourish_kids_capacity","program")]},
      {id:"goal-winter",town,requester:"recipient-winter",priority:2,
        requirements:[io("winter_support_capacity","program")]},
      {id:"goal-table",town,requester:"recipient-table",priority:1,
        requirements:[io("common_table_capacity","event")]}
    ]
  };
}

export function validateGenerativeFixture(f) {
  if (f?.label!=="SYNTHETIC_ONLY") specError("synthetic only");
  if (!Array.isArray(f.towns) || f.towns.length<1 || f.towns.length>8
    || f.towns.some(t=>!isId(t)) || new Set(f.towns).size!==f.towns.length)
    specError("towns");
  if (!Array.isArray(f.inventory)||f.inventory.length>60
    || !Array.isArray(f.recipes)||f.recipes.length>10
    || !Array.isArray(f.goals)||f.goals.length>12)
    specError("bounds");
  const towns=new Set(f.towns), ids=new Set();
  function typed(a){
    return a && isId(a.resource) && isId(a.unit) && positive(a.quantity)
      && a.quantity<=10000;
  }
  for(const v of f.inventory){
    if(!isId(v.id)||ids.has(v.id)||!towns.has(v.town)
       ||!isId(v.owner)||!typed(v)) specError("inventory");
    ids.add(v.id);
  }
  ids.clear();
  for(const r of f.recipes){
    if(!isId(r.id)||ids.has(r.id)||!towns.has(r.town)
      ||!isId(r.steward)||!isId(r.reviewer)||r.steward===r.reviewer
      ||!Array.isArray(r.inputs)||!Array.isArray(r.outputs)
      ||r.inputs.length<1||r.inputs.length>8||r.outputs.length<1||r.outputs.length>4
      ||r.inputs.some(x=>!typed(x))||r.outputs.some(x=>!typed(x)))
      specError("recipe");
    ids.add(r.id);
    // Self-feeding transformations are not admitted without an external model of production.
    if(r.inputs.some(i=>r.outputs.some(o=>same({...i,town:r.town},{...o,town:r.town}))))
      specError("self-feeding recipe");
  }
  ids.clear();
  for(const g of f.goals){
    if(!isId(g.id)||ids.has(g.id)||!towns.has(g.town)
      ||!isId(g.requester)||!positive(g.priority)||g.priority>10
      ||!Array.isArray(g.requirements)||g.requirements.length!==1
      ||!typed(g.requirements[0])) specError("goal");
    ids.add(g.id);
  }
  return true;
}
function startingStock(f){
  return [...f.inventory].sort(sortId).map(v=>({
    id:"raw:"+v.id, sourceId:v.id,resource:v.resource,
    unit:v.unit,town:v.town,quantity:v.quantity,owner:v.owner,producedBy:null
  }));
}
function allocate(stock,req,town){
  let left=req.quantity;
  const consumed=[];
  for(const lot of [...stock].sort(sortId)){
    if(left===0) break;
    if(lot.town!==town || lot.resource!==req.resource || lot.unit!==req.unit)continue;
    const n=Math.min(lot.quantity,left);
    if(n>0){consumed.push({lotId:lot.id,quantity:n,owner:lot.owner,
      producedBy:lot.producedBy});left-=n;}
  }
  return left===0?consumed:null;
}
function spend(stock,allocations){
  const used = new Map();
  for(const a of allocations)used.set(a.lotId,(used.get(a.lotId)||0)+a.quantity);
  return stock.map(lot=>({...lot,quantity:lot.quantity-(used.get(lot.id)||0)}))
    .filter(l=>l.quantity>0);
}
function applyRecipe(state,recipe) {
  let stock=state.stock, allocations=[];
  for(const req of recipe.inputs){
    const got=allocate(stock,req,recipe.town);
    if(!got)return null;
    allocations.push(...got);
    stock=spend(stock,got);
  }
  const outputs=recipe.outputs.map((v,i)=>({
    id:"derived:"+recipe.id+":"+i, resource:v.resource,unit:v.unit,
    town:recipe.town,quantity:v.quantity,owner:recipe.steward,
    producedBy:"step:"+recipe.id
  }));
  const step={
    id:"step:"+recipe.id,recipeId:recipe.id,town:recipe.town,
    steward:recipe.steward,reviewer:recipe.reviewer,
    inputs:allocations,outputs,
    dependencies:[...new Set(allocations.map(a=>a.producedBy).filter(Boolean))].sort(),
    state:"PROPOSED_NOT_EXECUTED"
  };
  return {stock:[...stock,...outputs],steps:[...state.steps,step],
    used:[...state.used,recipe.id]};
}
function evaluateGoals(state,goals){
  let stock=state.stock, served=[],unsatisfied=[];
  for(const goal of [...goals].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
    const wanted=goal.requirements[0];
    const allocations=allocate(stock,wanted,goal.town);
    if(!allocations){unsatisfied.push(goal.id);continue;}
    stock=spend(stock,allocations);
    served.push({
      goalId:goal.id,requester:goal.requester,town:goal.town,
      priority:goal.priority,resource:wanted.resource,unit:wanted.unit,
      quantity:wanted.quantity,allocations,
      providers:[...new Set(allocations.map(a=>a.owner))].sort()
    });
  }
  return {served,unmet:unsatisfied.sort(),score:served.reduce((n,g)=>n+g.priority,0),
    count:served.length};
}
function choiceKey(state){
  return stable({used:[...state.used].sort(),stock:state.stock.map(l=>[l.id,l.quantity]).sort(
    (a,b)=>a[0].localeCompare(b[0]))});
}
function rank(candidate,best){
  if(!best)return true;
  for(const key of ["score","count"])if(candidate[key]!==best[key])return candidate[key]>best[key];
  if(candidate.steps.length!==best.steps.length)return candidate.steps.length<best.steps.length;
  const spent = x=>x.steps.reduce((n,s)=>n+s.inputs.length,0);
  if(spent(candidate)!==spent(best))return spent(candidate)<spent(best);
  return candidate.steps.map(s=>s.id).join("|")<best.steps.map(s=>s.id).join("|");
}
export function compilePossibilities(fixture,{maxDepth=6,maxNodes=20000}={}){
  validateGenerativeFixture(fixture);
  if(!Number.isSafeInteger(maxDepth)||maxDepth<0||maxDepth>8
    ||!Number.isSafeInteger(maxNodes)||maxNodes<10||maxNodes>100000)
    throw Error("Invalid bounded planning controls");
  const recipes=[...fixture.recipes].sort(sortId);
  const queue=[{stock:startingStock(fixture),used:[],steps:[]}];
  let examined=0, best=null;
  const visited=new Set();
  for(let offset=0;offset<queue.length;offset++){
    if(++examined>maxNodes)throw Error("Planner search bound exceeded; result withheld");
    const state=queue[offset], key=choiceKey(state);
    if(visited.has(key))continue;
    visited.add(key);
    const coverage=evaluateGoals(state,fixture.goals);
    const candidate={...state,...coverage};
    if(rank(candidate,best))best=candidate;
    if(state.steps.length===maxDepth)continue;
    for(const recipe of recipes){
      if(state.used.includes(recipe.id))continue;
      const next=applyRecipe(state,recipe);
      if(next)queue.push(next);
      if(queue.length>100000)throw Error("Planner queue bound exceeded");
    }
  }
  const original=startingStock(fixture);
  const baseline=evaluateGoals({stock:original},fixture.goals);
  const selectedSteps=best.steps;
  const selectedGoals=best.served;
  const requiredActors=[...new Set([
    ...selectedSteps.flatMap(s=>[s.steward,s.reviewer,...s.inputs.map(a=>a.owner)]),
    ...selectedGoals.flatMap(g=>[g.requester,...g.providers])
  ])].sort();
  const proposal={
    id:"proposal:unfutures-003",environment:"SYNTHETIC_ONLY",status:"HOLD",
    policy:"WEIGHTED_GOALS_THEN_COUNT_THEN_FEWEST_STEPS",
    steps:selectedSteps,goals:selectedGoals,unmet:best.unmet,
    requiredActors,proposedOutputs:selectedSteps.flatMap(s=>s.outputs),
    inputInventory:original,remainingStock:best.stock,
    executedSteps:0, verifiedFieldOutcomes:0
  };
  return {
    label:"SYNTHETIC_ONLY",baseline:{
      fulfilledGoals:baseline.served.map(g=>g.goalId),count:baseline.count,score:baseline.score
    },search:{examined,uniqueStates:visited.size,maxDepth,maxNodes,completeWithinBounds:true},
    result:{goalCount:best.count,weightedPriority:best.score,steps:selectedSteps.length,
      goalIds:selectedGoals.map(g=>g.goalId),unmet:best.unmet},
    proposal
  };
}
function planFingerprint(plan,hashFn){
  return hashFn(stable(plan));
}
export function replayFormation(plan,events,hashFn){
  if(typeof hashFn!=="function"||plan?.environment!=="SYNTHETIC_ONLY"
    ||!Array.isArray(plan.steps)||!Array.isArray(plan.goals)
    ||!Array.isArray(plan.requiredActors))throw Error("Invalid synthetic formation plan");
  const states={status:"HOLD",consents:{},stepReports:{},stepConfirms:{},
    goalReports:{},goalConfirms:{},withdrawnBy:null};
  const steps=new Map(plan.steps.map(s=>[s.id,s]));
  const goals=new Map(plan.goals.map(g=>[g.goalId,g]));
  let previous="GENESIS";
  for(let i=0;i<events.length;i++){
    const event=events[i],{hash,...e}=event;
    if(e.seq!==i+1||e.previous!==previous
      ||e.planFingerprint!==planFingerprint(plan,hashFn)
      ||hash!==hashFn(stable(e)))throw Error("Formation journal integrity failure");
    if(e.action==="CONSENT"){
      if(states.status!=="HOLD"||!plan.requiredActors.includes(e.actor)
        ||Object.hasOwn(states.consents,e.actor)||!["YES","NO"].includes(e.decision))
        throw Error("Invalid formation consent");
      states.consents[e.actor]=e.decision;
      if(e.decision==="NO")states.status="REFUSED";
      else if(plan.requiredActors.every(a=>states.consents[a]==="YES"))
        states.status="COMMITTED";
    } else if(e.action==="WITHDRAW"){
      if(!["HOLD","COMMITTED"].includes(states.status)
        ||!plan.requiredActors.includes(e.actor)
        ||Object.keys(states.stepReports).length||Object.keys(states.goalReports).length)
        throw Error("Withdrawal requires human dispute review after activity");
      states.status="CANCELLED";states.withdrawnBy=e.actor;
    } else if(e.action==="REPORT_STEP"){
      const step=steps.get(e.stepId);
      if(!step||!["COMMITTED","IN_PROGRESS"].includes(states.status)
        ||e.actor!==step.steward||Object.hasOwn(states.stepReports,e.stepId)
        ||typeof e.note!=="string"||!e.note.trim()
        ||step.dependencies.some(id=>!states.stepConfirms[id]))
        throw Error("Unready or unauthorized step report");
      states.stepReports[e.stepId]={actor:e.actor,note:e.note};
      states.status="IN_PROGRESS";
    } else if(e.action==="CONFIRM_STEP"){
      const step=steps.get(e.stepId);
      if(!step||states.status!=="IN_PROGRESS"
        ||!Object.hasOwn(states.stepReports,e.stepId)
        ||Object.hasOwn(states.stepConfirms,e.stepId)
        ||e.actor!==step.reviewer||e.actor===step.steward||e.decision!=="YES")
        throw Error("Invalid independent step confirmation");
      states.stepConfirms[e.stepId]=e.actor;
    } else if(e.action==="REPORT_GOAL"){
      const goal=goals.get(e.goalId);
      if(!goal||!["COMMITTED","IN_PROGRESS"].includes(states.status)
        ||!goal.providers.includes(e.actor)
        ||goal.allocations.some(a=>a.producedBy&&!states.stepConfirms[a.producedBy])
        ||Object.hasOwn(states.goalReports[e.goalId]||{},e.actor)
        ||typeof e.note!=="string"||!e.note.trim())
        throw Error("Unready or unauthorized goal report");
      states.goalReports[e.goalId]??={};
      states.goalReports[e.goalId][e.actor]=e.note;
      states.status="IN_PROGRESS";
    } else if(e.action==="CONFIRM_GOAL"){
      const goal=goals.get(e.goalId);
      if(!goal||states.status!=="IN_PROGRESS"
        ||Object.hasOwn(states.goalConfirms,e.goalId)
        ||e.actor!==goal.requester||goal.providers.includes(e.actor)
        ||e.decision!=="YES"
        ||!goal.providers.every(a=>Object.hasOwn(states.goalReports[e.goalId]||{},a)))
        throw Error("Invalid independent goal confirmation");
      states.goalConfirms[e.goalId]=e.actor;
      if(plan.steps.every(s=>states.stepConfirms[s.id])
        && plan.goals.every(g=>states.goalConfirms[g.goalId]))states.status="CONFIRMED";
    } else throw Error("Unknown formation event");
    previous=hash;
  }
  return {...states,head:previous,eventCount:events.length};
}
export function formationJournal(plan,hashFn){
  const events=[];
  return {events,append(action,actor,fields={}){
    if(!isId(actor)||!fields||typeof fields!=="object"
      ||Object.keys(fields).some(k=>
        ["action","actor","seq","previous","planFingerprint","hash"].includes(k)))
      throw Error("Invalid event fields");
    const body={seq:events.length+1,previous:events.at(-1)?.hash||"GENESIS",
      planFingerprint:planFingerprint(plan,hashFn),action,actor,...fields};
    const event={...body,hash:hashFn(stable(body))};
    replayFormation(plan,[...events,event],hashFn);
    events.push(event);
    return event;
  },snapshot:()=>replayFormation(plan,events,hashFn)};
}
export function toCapabilityBoard(compiled,snapshot=null){
  if(compiled.label!=="SYNTHETIC_ONLY")throw Error("No live projection");
  const plan=compiled.proposal;
  const state=snapshot||{status:"HOLD",consents:{},stepConfirms:{},goalConfirms:{}};
  return {
    schema:"reality2.unfutures-capability-board/v0",
    environment:"SYNTHETIC_ONLY",view:"OFFLINE_GENERATIVE_QUESTS",
    noMoney:true,noTrading:true,noActualPermissions:true,
    baseline:compiled.baseline,result:compiled.result,
    steps:plan.steps.map(s=>({
      id:s.id,recipeId:s.recipeId,dependencies:s.dependencies,
      inputs:s.inputs.map(a=>({lotId:a.lotId,quantity:a.quantity,producedBy:a.producedBy})),
      outputs:s.outputs.map(o=>({lotId:o.id,resource:o.resource,unit:o.unit,
        quantity:o.quantity,proposed:true})),
      confirmedInSimulation:!!state.stepConfirms?.[s.id]
    })),
    goals:plan.goals.map(g=>({
      id:g.goalId,resource:g.resource,unit:g.unit,quantity:g.quantity,
      sources:g.allocations.map(a=>a.lotId),
      confirmedInSimulation:!!state.goalConfirms?.[g.goalId]
    })),
    unresolved:plan.unmet,
    status:state.status,approvals:{
      received:Object.values(state.consents||{}).filter(x=>x==="YES").length,
      required:plan.requiredActors.length},
    warning:"Every output is a proposed capability, not stock or accomplished field work."
  };
}
// Hypothetical adapter to the 002 reactor. This does NOT make output executable stock.
export function shadowOffersForReactor(compiled){
  if(compiled.label!=="SYNTHETIC_ONLY")throw Error("No live reactor offers");
  const plan=compiled.proposal;
  // Export only terminal products. An intermediate consumed upstream is NEVER
  // simultaneously offered to a second hypothetical cycle.
  const usedInSteps=new Set(plan.steps.flatMap(s=>s.inputs
    .filter(a=>a.producedBy).map(a=>a.lotId)));
  return plan.proposedOutputs.filter(o=>!usedInSteps.has(o.id)).map(o=>({
    id:"shadow:"+o.id,town:o.town,resource:o.resource,unit:o.unit,
    quantity:o.quantity,owner:o.owner,localOnly:false,
    status:"UNVERIFIED_PROPOSED_OUTPUT",admission:"HOLD",
    transferAuthority:false,liveInventory:false,
    conflictsWithGoals:plan.goals.filter(g=>g.allocations
      .some(a=>a.lotId===o.id)).map(g=>g.goalId),
    source:"UNFUTURES-003"
  }));
}
