// GRAFT-029 — closed-grammar synthesis of a NEW guarded graph edit.
// Genuinely new executable JavaScript source is generated from a bounded
// MOTIF gap + synthetic labeled demonstrations; never auto-installed.
// This is finite rule search, not arbitrary program synthesis.
import {createHash} from 'node:crypto';
const sha = s=>createHash('sha256').update(s).digest('hex');
export const digest=x=>sha(JSON.stringify(x));
export class HOLD extends Error {}
const ok=(p,msg)=>{if(!p)throw new HOLD(msg)};
const ident=s=>typeof s==='string'&&/^[a-z][a-z0-9_]{2,24}$/.test(s);
const truth=x=>x===true||x===false;
const fact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const allowed=new Set(['broken','permits']);
export const GRAMMAR='TYPED_GUARDED_ADDITION_2_OPTIONAL_ANTECEDENTS_V0';
const TEMPLATE=`// GRAFT-029 locally-generated guarded graph operator. NO I/O or grants.
export function execute(request){
 if(!request||typeof request!=='object'||Array.isArray(request)||
   !Array.isArray(request.world)||request.world.length>40||
   !request.roles||typeof request.roles!=='object'||
   !['owner','actor','target'].every(k=>typeof request.roles[k]==='string'&&
     /^[A-Za-z0-9_]{1,20}$/.test(request.roles[k]))||
   request.world.some(f=>!Array.isArray(f)||f.length<2||f.length>4||
     f.some(t=>typeof t!=='string'||t.length>36))) return {status:'HOLD_BAD_INPUT',added:null};
 const r=request.roles, w=request.world;
 const contains=f=>w.some(x=>x.length===f.length&&x.every((v,i)=>v===f[i]));
 if(!contains(['person',r.owner])||!contains(['person',r.actor])||
   !contains(['bike',r.target])) return {status:'HOLD_UNTYPED',added:null};
 const goal=[CFG.add_relation,r.target];
 if(contains(goal)) return {status:'HOLD_ALREADY_PRESENT',added:null};
 for(const gate of CFG.require_gates){
   const required=gate==='broken'?['broken',r.target]:
     ['permits',r.owner,r.actor,r.target];
   if(!contains(required))return {status:'HOLD_GUARD',added:null};
 }
 return {status:'PROPOSED_SYNTHETIC_ADD',added:goal};
}`;
export function validateGap(gap){
 ok(gap&&typeof gap==='object'&&!Array.isArray(gap),'HOLD_GAP_TYPE');
 const {content_sha256,...body}=gap;
 ok(content_sha256===digest(body),'HOLD_GAP_DIGEST');
 ok(gap.schema==='motif.missing-operator.v0'&&
    gap.scope==='CLOSED_SYNTHETIC_REWRITE_ONLY'&&
    gap.status==='PROVEN_UNREACHABLE_UNDER_ORIGINAL_FIXED_VERBS'&&
    gap.original_source_commit==='5ee9207f04af2826750863526af7f92b31ef8578'&&
    gap.proof?.invariant==='NO_ORIGINAL_VERB_ADDS_REQUESTED_PREDICATE'&&
    gap.proof?.exact_predicate_absent_from_start===true&&
    gap.proof?.all_original_effects_exclude_predicate===true&&
    gap.permission_to_propose_local_code===true&&
    gap.permission_to_deploy===false&&gap.permission_to_contact===false,
    'HOLD_UNPROVEN_GAP_OR_AUTHORITY');
 ok(ident(gap.requested_goal?.[0])&&gap.requested_goal.length===2&&
   ident(gap.requested_target_type)&&gap.requested_target_type==='bike'&&
   gap.requested_goal[0]!=='permits'&&gap.requested_goal[0]!=='broken'&&
   gap.requested_goal[0]!=='person'&&gap.requested_goal[0]!=='bike'&&
   typeof gap.requested_goal[1]==='string'&&gap.requested_goal[1].length>0,
   'HOLD_UNSUPPORTED_REWRITE_GOAL');
 return true;
}
export function compileVariant(gap,gates){
 validateGap(gap);
 ok(Array.isArray(gates)&&gates.length>=1&&gates.length<=2&&
   gates.every(g=>allowed.has(g))&&new Set(gates).size===gates.length,
   'HOLD_UNSUPPORTED_OPERATOR_GRAMMAR');
 const config={add_relation:gap.requested_goal[0],require_gates:[...gates].sort()};
 const source='const CFG='+JSON.stringify(config)+';\n'+TEMPLATE+'\n';
 ok(source.length<5000,'HOLD_SOURCE_BUDGET');
 return {schema:'graft029.generated-graph-operator/v0',
   source,source_sha256:sha(source),add_relation:config.add_relation,
   guard_contract:config.require_gates,runner:'NO_IO_PURE_FUNCTION',
   code_installed:false,external_authority:false};
}
const legalSample=(s,gap)=>{
 ok(s&&Array.isArray(s.world)&&s.world.length<=40&&
   s.roles&&typeof s.roles==='object'&&truth(s.expect)&&
   ['owner','actor','target'].every(k=>typeof s.roles[k]==='string'&&
     /^[A-Za-z0-9_]{1,20}$/.test(s.roles[k]))&&
   s.world.every(f=>Array.isArray(f)&&f.length>=2&&f.length<=4&&
     f.every(k=>typeof k==='string'&&k.length<40))&&
   s.roles.target.length>0,
   'HOLD_UNSAFE_LABELLED_CASE');
 return true;
};
export function validCases(cases,gap){
 ok(cases&&typeof cases==='object'&&
   ['train','selection','negative'].every(k=>
     Array.isArray(cases[k])&&cases[k].length>=1&&cases[k].length<=12),
    'HOLD_BAD_CASE_BUDGET');
 for(const items of [cases.train,cases.selection,cases.negative])
   for(const row of items)legalSample(row,gap);
 return true;
}
async function nativeRun(source, sample){
 const {execute}=await import('data:text/javascript;base64,'+
   Buffer.from(source).toString('base64'));
 const actual=execute({world:sample.world,roles:sample.roles});
 return {matches:(actual.status==='PROPOSED_SYNTHETIC_ADD')===sample.expect,
   status:actual.status,added:actual.added};
}
export async function cultivate(gap,cases){
 validateGap(gap);validCases(cases,gap);
 const families=[['broken'],['permits'],['broken','permits']];
 const records=[];
 for(const guards of families){
   const gen=compileVariant(gap,guards);
   const train=await Promise.all(cases.train.map(s=>nativeRun(gen.source,s)));
   const selection=await Promise.all(cases.selection.map(s=>nativeRun(gen.source,s)));
   const negative=await Promise.all(cases.negative.map(s=>nativeRun(gen.source,s)));
   records.push({
      candidate:gen,
      train_correct:train.filter(r=>r.matches).length,
      selection_correct:selection.filter(r=>r.matches).length,
      negative_correct:negative.filter(r=>r.matches).length,
      counts:[train.length,selection.length,negative.length],
      held_validated:train.every(r=>r.matches)&&selection.every(r=>r.matches)&&
        negative.every(r=>r.matches),
      failures:[
        ...train.flatMap((x,i)=>x.matches?[]:['train:'+i]),
        ...selection.flatMap((x,i)=>x.matches?[]:['selection:'+i]),
        ...negative.flatMap((x,i)=>x.matches?[]:['negative:'+i])
      ]
   });
 }
 const admissible=records.filter(r=>r.held_validated);
 const winner=admissible.length===1?admissible[0]:null;
 const body={
   schema:'graft029.operator-synthesis-review/v0',
   status:winner?'HELD_GENERATED_OPERATOR_FAMILY':'HOLD_AMBIGUOUS_OR_UNSOLVED',
   gap_sha256:gap.content_sha256,generated_family:GRAMMAR,
   variants_generated:records.length,
   leaderboard:records.map(({candidate,...rest})=>({
      source_sha256:candidate.source_sha256,
      guard_contract:candidate.guard_contract,...rest
   })),
   selected:winner?winner.candidate:null,
   train_count:cases.train.length,selection_count:cases.selection.length,
   negative_count:cases.negative.length,
   source_authority:'NONE',external_actions:0,auto_install:false,
   source_owner_selected_canon:false,
   ordinary_classical_induction_may_also_learn_from_demos:true
 };
 return {...body,content_sha256:digest(body)};
}
export function casesForSyntheticGraph(){
 const mk=(owner,actor,target,options={})=>{
  const {broken=true,permit=true,wrongActor=false,typed=true}=options;
  const w=[['person',owner],['person',actor],['bike',target]];
  if(!typed)w.pop();
  if(broken)w.push(['broken',target]);
  if(permit)w.push(['permits',owner,wrongActor?'Stranger':actor,target]);
  return {world:w,roles:{owner,actor,target},expect:broken&&permit&&!wrongActor&&typed};
 };
 return {
  train:[mk('Ava','Bo','cycleA'),mk('Dee','Em','cycleB')],
  selection:[mk('Jo','Mira','bike1'),
             mk('Jo','Mira','bike1',{permit:false}),
             mk('Jo','Mira','bike1',{broken:false})],
  negative:[mk('Fin','Gil','cycleC',{wrongActor:true}),
            mk('Hal','Ian','cycleD',{typed:false}),
            mk('Jo','Mira','bike2',{broken:false,permit:false})]
 };
}
