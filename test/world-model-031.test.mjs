import test from 'node:test';
import assert from 'node:assert/strict';
import {digest,HOLD,EVENT,GRAMMAR,MODES,fixture,fixtureSets,
  inferOpening,makeTicket,verifyTicket,compileVariant,evaluate,cultivate}
  from '../src/world-model-031.mjs';
const packet=()=>makeTicket(fixture().before,fixture().after);
test('genuinely new missing-model question is computed from before/after source',()=>{
 const x=packet();assert.equal(x.status,'OLD_GRAMMAR_CANNOT_LOSE_BLUE_OBSTACLES');
 assert.deepEqual(x.opened_cells,[[4,3],[4,4]]);
 assert.equal(x.blue_before,8);
 assert.equal(x.blue_after,6);
 assert.equal(verifyTicket(x).length,2);
 assert.equal(x.authority.live_observations,0);
});
test('a stationary-obstacle model cannot explain these paired images',()=>{
 const x=packet();
 assert.ok(x.blue_after<x.blue_before);
 assert.equal(x.proof,'PREVIOUS_MOVE_COPY_RECOLOR_NEVER_REMOVE_BLUE');
});
test('generate three executable, distinct and bounded new model families',()=>{
 const variants=MODES.map(mode=>compileVariant(packet(),mode));
 assert.equal(variants.length,3);
 assert.equal(new Set(variants.map(v=>v.source_sha256)).size,3);
 assert.ok(variants.every(v=>v.source.includes('export function execute')));
 assert.ok(variants.every(v=>v.permission_to_operate_a_physical_gate===false));
});
test('source-born environmental gate proposal is chosen by real training/selection/negative cases',async()=>{
 const result=await cultivate(packet(),fixtureSets());
 assert.equal(result.status,'HELD_NEW_EXTERNAL_EVENT_MODEL');
 assert.equal(result.chosen.mode,'open_observed_pair');
 assert.equal(result.candidate_count,3);
 assert.equal(result.considered.filter(x=>x.accepted).length,1);
 assert.equal(result.network_calls,0);
 assert.equal(result.auto_install,false);
});
test('generated operator acts on unseen synthetic red positions but same anchored wall',async()=>{
 const s=compileVariant(packet(),'open_observed_pair');
 for(const x of fixtureSets().selection)
  assert.equal((await evaluate(s,x)).correct,true);
});
test('new model explicitly denies commands framed as real physical gate operations',async()=>{
 const s=compileVariant(packet(),'open_observed_pair');
 const result=await evaluate(s,fixtureSets().negative[0]);
 assert.equal(result.correct,true);
 assert.equal(result.status,'HOLD_EVENT_NOT_SIMULATED');
});
test('new model rejects opening an already open gate twice',async()=>{
 const result=await evaluate(compileVariant(packet(),'open_observed_pair'),
   fixtureSets().negative[1]);
 assert.equal(result.correct,true);
 assert.equal(result.status,'HOLD_GATE_ANCHOR_NOT_CLOSED');
});
test('older competing model families cannot fit new observed transition',async()=>{
 const row=fixtureSets().train[0];
 for(const mode of ['unchanged','erase_all_blue'])
  assert.equal((await evaluate(compileVariant(packet(),mode),row)).correct,false);
});
test('requires exact same 2-cell gate observation across training, not arbitrary new cell',async()=>{
 const c=fixtureSets();const before=c.train[0].before;
 c.train[0].after=before.map((r,y)=>[...r].map((v,x)=>
   x===4&&(y===5||y===6)?'.':v).join(''));
 await assert.rejects(cultivate(packet(),c),HOLD);
});
test('tampering a before-after question even with recomputed checksum is refused',()=>{
 const x=packet();x.authority.deploy=true;
 const {content_sha256,...rest}=x;x.content_sha256=digest(rest);
 assert.throws(()=>verifyTicket(x),HOLD);
});
test('one-cell and three-cell transformations are not silently admitted',()=>{
 const x=fixture();
 const once=x.after.map((r,y)=>y===4?r.slice(0,4)+'#'+r.slice(5):r);
 assert.throws(()=>inferOpening(x.before,once),HOLD);
});
test('red movement cannot be disguised as external environmental observation',()=>{
 const x=fixture();
 const changed=x.after.map((r,y)=>y===3?r.replace('R','.') :r);
 assert.throws(()=>inferOpening(x.before,changed),HOLD);
});
test('contradictory selection evidence produces HOLD and no generated operator',async()=>{
 const rows=fixtureSets();rows.selection[0].after=rows.selection[1].after;
 const result=await cultivate(packet(),rows);
 assert.equal(result.status,'HOLD_UNSOLVED_OR_MULTIPLE');
 assert.equal(result.chosen,null);
});
test('produces reproducible source and content-addressed held receipt',async()=>{
 const a=await cultivate(packet(),fixtureSets());
 const b=await cultivate(packet(),fixtureSets());
 assert.deepEqual(a,b);
 const {content_sha256,...rest}=a;assert.equal(content_sha256,digest(rest));
 assert.equal(a.classical_equal_information_baseline_can_match,true);
});
