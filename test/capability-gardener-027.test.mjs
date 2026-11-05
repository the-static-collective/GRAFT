import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {proposeVariants,cultivate,compileVariant} from '../src/capability-gardener-027.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function packet(){
 const blob='a'.repeat(40),commit='b'.repeat(40),repository='example/weather-openapi';
 const body={
  schema:'alex026.api-discovery/v0',status:'PROPOSED_NEW_PUBLIC_SOURCE_ADAPTER',
  authority:'none',no_candidate_endpoint_contact:true,
  unreviewed_spec_documents:[{repository,source_commit:commit,path:'openapi.json',
   git_blob:blob,complete_original_blob_verified:true}],
  public_provider_proposals:[{
   schema:'alex026.source-attested-api-proposal/v0',provider_name:'Example Weather',
   repository,source_commit:commit,spec_path:'openapi.json',git_blob:blob,
   operation:{method:'GET',path:'/forecast',summary:'Hourly forecast'},
   declared_servers:['https://example.org'],spec_format:'OPENAPI3_JSON_GIT_BLOB_VERIFIED',
   candidate_host_contact_authorized:false,production_permissions:'NONE'}]
 };
 return {...body,checksum_sha256:sha(body)};
}
const response=body=>({status:200,contentType:'application/json',body});
const data={
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
};
test('new JSON field grammar synthesizes many code-distinct executable candidates',()=>{
 const p=proposeVariants(packet(),data);
 assert.equal(p.status,'REVIEWABLE_VARIANTS');
 assert.ok(p.variants.length>=3);
 assert.ok(p.variants.some(x=>x.selector.join('.')==='current.temperature_2m'));
 assert.ok(p.variants.some(x=>x.selector.join('.')==='wrong.temperature'));
 assert.ok(new Set(p.variants.map(x=>x.source_sha256)).size>=3);
 assert.ok(p.variants.every(x=>x.network_authority==='NONE'&&x.code_installed===false));
});
test('held-out data and negatives select a valid candidate and record rejected variants',async()=>{
 const p=await cultivate(packet(),data);
 assert.equal(p.status,'HELD_BEST_FIXTURE_CANDIDATE');
 assert.deepEqual(p.winner.selector,['current','temperature_2m']);
 assert.ok(p.variants_tested>=3);
 assert.equal(p.automated_tests_executed,p.variants_tested*7);
 assert.equal(p.production_install,false);
 assert.equal(p.live_server_contacted,false);
 assert.ok(p.leaderboard.some(x=>!x.admissible_for_fixture_review&&x.failures.length>0));
});
test('adversarial contradictory withheld cases cause HOLD rather than self-certification',async()=>{
 const conflict={...data,holdout:[
  {response:response({current:{temperature_2m:20,humidity:1},wrong:{temperature:25}}),expected:999}
 ]};
 const r=await cultivate(packet(),conflict);
 assert.equal(r.status,'HOLD_ALL_VARIANTS_FAIL');
 assert.equal(r.winner,null);
 assert.match(r.failure_driven_next_question,/independently labeled/i);
});
test('prototype pollution and unsafe paths are rejected before any executable generation',()=>{
 for(const p of [['__proto__'],['constructor'],['current','prototype'],['bad/key']])
  assert.throws(()=>compileVariant(p),/UNSAFE_SOURCE_FIELD_PATH/);
 const p=compileVariant(['unexpectedField987']);
 assert.ok(p.source.includes('"unexpectedField987"'));
 assert.ok(!p.source.includes('fetch('));
});
test('source receipts cannot grant arbitrary authority or change the selected service',async()=>{
 const p=packet();
 assert.throws(()=>proposeVariants({...p,authority:'owner'},data),/INVALID_PROVIDER_DISCOVERY/);
 assert.throws(()=>proposeVariants({...p,public_provider_proposals:[]},data),/TAMPERED/);
 assert.throws(()=>proposeVariants(p,{...data,hint:'<'.repeat(99)}),/UNCLEAR_EXTRACTION_TARGET/);
});
