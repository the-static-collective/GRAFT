import test from 'node:test';
import assert from 'node:assert/strict';
import {compileVariant,cultivate,validateGap,digest,casesForSyntheticGraph,validCases,HOLD}
  from '../src/missing-operator-forge-029.mjs';
const question=()=>{
 const body={
  schema:'motif.missing-operator.v0',scope:'CLOSED_SYNTHETIC_REWRITE_ONLY',
  status:'PROVEN_UNREACHABLE_UNDER_ORIGINAL_FIXED_VERBS',
  original_source_commit:'5ee9207f04af2826750863526af7f92b31ef8578',
  requested_goal:['inspected','bike1'],requested_target_type:'bike',
  proof:{invariant:'NO_ORIGINAL_VERB_ADDS_REQUESTED_PREDICATE',
         exact_predicate_absent_from_start:true,
         all_original_effects_exclude_predicate:true},
  permission_to_propose_local_code:true,permission_to_deploy:false,
  permission_to_contact:false
 };
 return {...body,content_sha256:digest(body)};
};
async function invoke(src,world,roles){
 const {execute}=await import('data:text/javascript;base64,'+
   Buffer.from(src).toString('base64'));
 return execute({world,roles});
}
test('finite source-owning grammar accepts only held source-typed missing operator gap',()=>{
 assert.equal(validateGap(question()),true);
 const fake=question();fake.permission_to_deploy=true;
 assert.throws(()=>validateGap(fake),HOLD);
 const rehashed={...fake};delete rehashed.content_sha256;
 fake.content_sha256=digest(rehashed);
 assert.throws(()=>validateGap(fake),HOLD);
});
test('generate multiple source-distinct executable transformations',async()=>{
 const gap=question();
 const a=compileVariant(gap,['broken']);
 const b=compileVariant(gap,['permits']);
 const both=compileVariant(gap,['permits','broken']);
 assert.equal(new Set([a.source_sha256,b.source_sha256,both.source_sha256]).size,3);
 assert.deepEqual(both.guard_contract,['broken','permits']);
 assert.ok(!both.source.includes('fetch('));
 assert.ok(!both.source.includes('writeFileSync('));
 assert.equal(both.code_installed,false);
});
test('training-only rules fail selected negatives; original source selects two guards',async()=>{
 const data=casesForSyntheticGraph(),r=await cultivate(question(),data);
 assert.equal(r.status,'HELD_GENERATED_OPERATOR_FAMILY');
 assert.equal(r.variants_generated,3);
 assert.deepEqual(r.selected.guard_contract,['broken','permits']);
 assert.equal(r.leaderboard.filter(x=>x.held_validated).length,1);
 assert.ok(r.leaderboard.filter(x=>!x.held_validated).every(x=>x.failures.length));
 assert.equal(r.source_authority,'NONE');
 assert.equal(r.external_actions,0);
});
test('generated original operator creates a genuinely absent predicate in a fresh world',async()=>{
 const d=casesForSyntheticGraph().selection[0];
 const src=compileVariant(question(),['broken','permits']).source;
 const result=await invoke(src,d.world,d.roles);
 assert.deepEqual(result,{status:'PROPOSED_SYNTHETIC_ADD',added:['inspected','bike1']});
 assert.equal(d.world.some(f=>f[0]==='inspected'),false);
});
test('permission denial and incorrect actor refuse without phantom new facts',async()=>{
 const src=compileVariant(question(),['broken','permits']).source;
 for(const d of [...casesForSyntheticGraph().selection.slice(1),
                 ...casesForSyntheticGraph().negative]){
  const out=await invoke(src,d.world,d.roles);
  assert.notEqual(out.status,'PROPOSED_SYNTHETIC_ADD');
  assert.equal(out.added,null);
 }
});
test('same source refuses an already accomplished goal or changed entity type',async()=>{
 const d=casesForSyntheticGraph().selection[0],
   src=compileVariant(question(),['broken','permits']).source;
 assert.equal((await invoke(src,[...d.world,['inspected','bike1']],d.roles)).status,
              'HOLD_ALREADY_PRESENT');
 assert.equal((await invoke(src,d.world,{...d.roles,target:'bad'})).status,
              'HOLD_UNTYPED');
});
test('unknown emitted relation or unsafe grammar is refused',()=>{
 const q=question();q.requested_goal=['permits','bike1'];
 const b={...q};delete b.content_sha256;q.content_sha256=digest(b);
 assert.throws(()=>compileVariant(q,['broken']),HOLD);
 assert.throws(()=>compileVariant(question(),['eval']),HOLD);
 assert.throws(()=>compileVariant(question(),['broken','broken']),HOLD);
});
test('source content is deterministic and independently regenerable',async()=>{
 const gap=question(),cases=casesForSyntheticGraph();
 assert.deepEqual(await cultivate(gap,cases),await cultivate(gap,cases));
 const result=await cultivate(gap,cases),again=compileVariant(gap,result.selected.guard_contract);
 assert.equal(result.selected.source,again.source);
 assert.equal(result.selected.source_sha256,again.source_sha256);
 const {content_sha256,...rest}=result;assert.equal(digest(rest),content_sha256);
});
test('contradictory withheld labels demand HOLD, not an invented new power',async()=>{
 const data=casesForSyntheticGraph();
 data.selection[0].expect=false;
 const result=await cultivate(question(),data);
 assert.equal(result.status,'HOLD_AMBIGUOUS_OR_UNSOLVED');
 assert.equal(result.selected,null);
});
test('overlong input, nonobject roles, and malicious tokens refuse',async()=>{
 const src=compileVariant(question(),['broken','permits']).source;
 assert.equal((await invoke(src,[['bike','b']],{owner:'$',actor:'A',target:'b'})).status,
    'HOLD_BAD_INPUT');
 assert.equal((await invoke(src,Array(41).fill(['bike','x']),
   {owner:'A',actor:'B',target:'x'})).status,'HOLD_BAD_INPUT');
});
