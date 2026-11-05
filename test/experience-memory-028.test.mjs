import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
 captureExperience,verifyExperience,replayExperience,recallSimilar,fingerprint
} from '../src/experience-memory-028.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function source(){
 const blob='a'.repeat(40),commit='b'.repeat(40),repository='example/meteorology-public';
 const body={
  schema:'alex026.api-discovery/v0',status:'PROPOSED_NEW_PUBLIC_SOURCE_ADAPTER',
  authority:'none',no_candidate_endpoint_contact:true,
  unreviewed_spec_documents:[{repository,source_commit:commit,path:'openapi.json',
   git_blob:blob,complete_original_blob_verified:true}],
  public_provider_proposals:[{
   schema:'alex026.source-attested-api-proposal/v0',provider_name:'Example Weather',
   repository,source_commit:commit,spec_path:'openapi.json',git_blob:blob,
   operation:{method:'GET',path:'/forecast'},declared_servers:['https://example.org'],
   spec_format:'OPENAPI3_JSON_GIT_BLOB_VERIFIED',
   candidate_host_contact_authorized:false,production_permissions:'NONE'}]
 };
 return {...body,checksum_sha256:sha(body)};
}
const response=body=>({status:200,contentType:'application/json',body});
const weather=()=>({
 hint:'temperature',
 train:[
  {response:response({current:{temperature_2m:24,humidity:45},wrong:{temperature:24}}),expected:24},
  {response:response({current:{temperature_2m:26,humidity:46},wrong:{temperature:26}}),expected:26}
 ],
 holdout:[
  {response:response({current:{temperature_2m:19,humidity:70},wrong:{temperature:-30}}),expected:19},
  {response:response({current:{temperature_2m:-2,humidity:90},wrong:{temperature:20}}),expected:-2}
 ],
 negative:[
  {response:response({current:{temperature_2m:'bad'}}),reject:true},
  {response:response({current:{humidity:20}}),reject:true},
  {response:{status:503,contentType:'application/json',body:{current:{temperature_2m:19}}},reject:true}
 ]
});
const conflicting=()=>{
 const w=weather();
 w.holdout=[{response:response({current:{temperature_2m:20,humidity:20},wrong:{temperature:20}}),expected:999}];
 return w;
};
const unrelated=()=>({
 hint:'population',
 train:[{response:response({city:{population:45}}),expected:45}],
 holdout:[{response:response({city:{population:60}}),expected:60}],
 negative:[{response:response({city:{population:'unknown'}}),reject:true}]
});
test('explicit synthetic-only capture is byte stable and contains full executable replay evidence',async()=>{
 const s=source(),cases=weather();
 const first=await captureExperience({source_packet:s,cases,approvedSyntheticCapture:true});
 const second=await captureExperience({source_packet:s,cases,approvedSyntheticCapture:true});
 assert.deepEqual(first,second);
 assert.equal(first.outcome,'HELD_BEST_FIXTURE_CANDIDATE');
 assert.equal(first.provenance,'SYNTHETIC_LABELED_FIXTURES_ONLY');
 assert.equal(first.structure.paths.includes('current.temperature_2m:number'),true);
 assert.ok(first.evaluation.leaderboard.some(v=>v.failures.length>0));
 assert.equal(verifyExperience(first),true);
 const replay=await replayExperience(first);
 assert.equal(replay.status,'EXACT_EXECUTABLE_REPLAY_MATCH');
 assert.deepEqual(replay.winner.selector,['current','temperature_2m']);
 assert.equal(replay.external_actions,0);
});
test('failed experiments are durable evidence, not grounds for automatically promoting a candidate',async()=>{
 const s=source();
 const p=await captureExperience({source_packet:s,cases:conflicting(),
  approvedSyntheticCapture:true});
 assert.equal(p.outcome,'HOLD_ALL_VARIANTS_FAIL');
 assert.equal(p.evaluation.winner,null);
 const replay=await replayExperience(p);
 assert.equal(replay.status,'EXACT_EXECUTABLE_REPLAY_MATCH');
 assert.equal(replay.winner,null);
 assert.equal(p.production_install,false);
});
test('retrieve structurally related failures without confusing unrelated domains',async()=>{
 const s=source();
 const good=await captureExperience({source_packet:s,cases:weather(),approvedSyntheticCapture:true});
 const bad=await captureExperience({source_packet:s,cases:conflicting(),approvedSyntheticCapture:true});
 const distant=await captureExperience({source_packet:s,cases:unrelated(),approvedSyntheticCapture:true});
 const res=recallSimilar([bad,distant,good],weather());
 assert.equal(res.status,'STRUCTURALLY_SIMILAR_PRIOR_EXPERIMENTS');
 assert.ok(res.matches.some(m=>m.record_sha256===bad.receipt_sha256));
 assert.ok(res.matches.some(m=>m.record_sha256===good.receipt_sha256));
 assert.ok(!res.matches.some(m=>m.record_sha256===distant.receipt_sha256));
 assert.ok(res.matches.some(m=>m.previous_winner===null));
 assert.equal(res.no_automatic_candidate_selection,true);
 assert.ok(res.matches.every(m=>m.inference==='STRUCTURAL_NEIGHBOR_NOT_CAUSAL_PROOF'));
});
test('old experience stays honest when hypothetical data changes',async()=>{
 const r=await captureExperience({source_packet:source(),cases:weather(),
  approvedSyntheticCapture:true});
 const altered=structuredClone(r);
 altered.cases.holdout[0].expected=999;
 assert.throws(()=>verifyExperience(altered),/RECORD_CHANGED/);
 const recalc={...altered};delete recalc.receipt_sha256;
 altered.receipt_sha256=sha(recalc);
 assert.equal(verifyExperience(altered),true); // An attacker can rehash a local JSON record.
 await assert.rejects(replayExperience(altered),/REPLAY_DIVERGED/);
});
test('attacker cannot install code by editing a replay receipt or previous outcome',async()=>{
 const r=await captureExperience({source_packet:source(),cases:weather(),approvedSyntheticCapture:true});
 assert.throws(()=>verifyExperience({...r,authorization:'DEPLOY'}),/INVALID_MEMORY_RECORD/);
 const altered={...r,outcome:'HOLD_ALL_VARIANTS_FAIL'};
 const body={...altered};delete body.receipt_sha256;
 altered.receipt_sha256=sha(body);
 assert.throws(()=>verifyExperience(altered),/UNSUPPORTED_EVALUATION/);
});
test('no retention without explicit consent, never retain obvious secrets or contacts',async()=>{
 await assert.rejects(captureExperience({source_packet:source(),cases:weather()}),/EXPLICIT_CAPTURE_APPROVAL/);
 const w=weather();
 w.train[0].response.body.api_token='do-not-save';
 await assert.rejects(captureExperience({source_packet:source(),cases:w,
  approvedSyntheticCapture:true}),/PRIVATE_OR_OVERSIZED_EXPERIMENT/);
 const w2=weather();
 w2.train[0].response.body.email='anyone@example.org';
 await assert.rejects(captureExperience({source_packet:source(),cases:w2,
  approvedSyntheticCapture:true}),/PRIVATE_OR_OVERSIZED_EXPERIMENT/);
});
test('unrelated structural query returns no similar memory, with bounded result count',async()=>{
 const r=await captureExperience({source_packet:source(),cases:weather(),
  approvedSyntheticCapture:true});
 const res=recallSimilar([r],unrelated());
 assert.equal(res.status,'NO_CLOSE_STRUCTURAL_PRECEDENT');
 assert.equal(res.matches.length,0);
 assert.throws(()=>recallSimilar([r],weather(),{limit:99}),/MEMORY_QUERY_BUDGET/);
});
