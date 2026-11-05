import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {compileCapability,compileTemplate} from '../src/motif022-inquiry-compiler.mjs';
import {execute as lineage} from '../generated/motif022-lineage.mjs';
import {execute as compose} from '../generated/motif022-composition.mjs';
import {execute as trust} from '../generated/motif022-reliability.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const question='Which original ancestor should we trace?';
const body={schema:'alex.motif022.question-packet/v0',question,query_hash:sha(question),
 status:'RESEARCH_PACKET_HELD',
 hits:[{repository:'the-static-collective/MOTIF',source_commit:'a'.repeat(40),
 source_path:'README.md',line:4}],
 coverage:[],source_count:5,partial_coverage:true,
 real_independence_proved:false,authority:'none',external_actions:0};
const packet={...body,checksum:sha(JSON.stringify(body))};
function plan(intent){
 const b={schema:'planz.motif022.question-plan/v0',status:'PLAN_HELD_FOR_OWNER',
  alex_checksum:packet.checksum,intent,actions:['EMIT_HELD_CANDIDATE'],
  no_owner_approval:true,no_independence_certification:true,
  authority:'none',external_actions:0};
 return {...b,checksum:sha(JSON.stringify(b))};
}
test('three executable templates come from fixed source rather than user text',()=>{
 for(const mode of ['LINEAGE','COMPOSITION','RELIABILITY']){
  const output=compileCapability(packet,plan(mode));
  const saved=readFileSync(new URL('../generated/motif022-'+mode.toLowerCase()+'.mjs',import.meta.url),'utf8');
  assert.equal(saved,output.source);
  assert.equal(output.source,compileTemplate(mode));
  assert.equal(output.user_text_interpolated_into_code,false);
  assert.equal(output.production_installed,false);
 }
});
test('three generated capabilities execute with different purposes',()=>{
 const a=lineage(packet),b=compose(packet),c=trust(packet);
 assert.equal(a.mode,'LINEAGE');
 assert.equal(b.mode,'COMPOSITION');
 assert.equal(c.mode,'RELIABILITY');
 assert.notDeepEqual(a.questions,b.questions);
 assert.notDeepEqual(b.questions,c.questions);
 assert.equal(a.source_location_count,1);
 for(const x of [a,b,c]){
  assert.equal(x.evidence_admission,'NONE');
  assert.equal(x.autonomous_deployment,false);
  assert.equal(x.external_actions,0);
 }
});
test('tampered packet, false owner grants and unknown modes HOLD',()=>{
 assert.throws(()=>compileCapability({...packet,question:'changed'},plan('LINEAGE')),/CHECKSUM/);
 assert.throws(()=>compileCapability(packet,{...plan('LINEAGE'),no_owner_approval:false}),/UNADMITTED/);
 assert.throws(()=>compileTemplate('ARBITRARY_CODE'),/UNKNOWN_COMPILE_MODE/);
 assert.throws(()=>lineage({...packet,authority:'owner'}),/UNSAFE/);
});
