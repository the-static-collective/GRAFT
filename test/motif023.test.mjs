import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planEvidence} from '../vendor/planZ/motif023-replan.mjs';
import {verifyNativePlanZ,compileEvidenceCapability,executeCandidate}
 from '../src/motif023-compiler.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function source(question,n=2){
 const repos=['the-static-collective/GRAFT','the-static-collective/ALEX.2'].slice(0,n);
 const sources=repos.map((repo,i)=>({
  repository:repo,source_commit:'a'.repeat(40),tree_sha:'b'.repeat(40),
  public_eligibility_verified:true,
  selected_documents:[{path:'README.md',git_blob:'c'.repeat(40),size:120}]
 }));
 const body={
  schema:'alex.motif023.live-public-evidence/v0',
  status:'HELD_SOURCE_RESEARCH_PACKET',
  question,selection:{repositories:repos},
  sources,errors:[],
  hits:repos.map(repo=>({repository:repo,source_commit:'a'.repeat(40),
   path:'README.md',git_blob:'c'.repeat(40),line:3,
   support:'SEARCH_LEAD_NOT_ADMITTED_SOURCE_EVIDENCE'})),
  authority:'none',remote_writes:0,private_material_accessed:false,
  evidence_admission:'NONE',source_custody_authenticated:false
 };
 return {...body,receipt_sha256:hash(body)};
}
test('native original planZ source, not a rewritten fake, is Git-blob verified',()=>{
 const v=verifyNativePlanZ();
 assert.equal(v.exact_replan_blob,'5e4073cd245714eaca63036d60190780feb22171');
 assert.equal(v.original_classical_blob,'22d75c26039e5783b59cf71be02982428603128c');
});
test('two new observed plans produce different executable JS source, both run',async()=>{
 const one=source('Where does original Maxhinal source custody live?',1);
 const two=source('Which GRAFT compiler composes code?',2);
 const p1=planEvidence(one),p2=planEvidence(two);
 const c1=compileEvidenceCapability(one,p1);
 const c2=compileEvidenceCapability(two,p2);
 assert.equal(c1.mode,'LINEAGE');
 assert.equal(c2.mode,'COMPOSITION');
 assert.notEqual(c1.source_sha256,c2.source_sha256);
 assert.ok(c1.source.includes('export function execute(packet,plan)'));
 assert.ok(!c1.source.includes(one.question));
 assert.equal(c1.unsanitized_user_text_in_generated_code,false);
 const r1=await executeCandidate(c1,one,p1);
 const r2=await executeCandidate(c2,two,p2);
 assert.equal(r1.visible_source_location_count,1);
 assert.equal(r2.visible_source_location_count,2);
 assert.equal(r1.source_coverage_complete,false);
 assert.equal(r2.independent_custody_confirmed,false);
 assert.ok(r1.gaps.includes('UNCERTIFIED_SOURCE_FAMILY'));
 assert.ok(r1.gaps.includes('SINGLE_REPO_SAMPLE'));
 assert.equal(r2.external_actions,0);
 assert.notDeepEqual(r1.next_discriminating_question,r2.next_discriminating_question);
});
test('third classical mode produces a genuine independent-reference question',async()=>{
 const packet=source('Can independent reference witnesses drift?',2);
 const plan=planEvidence(packet);
 assert.equal(plan.mode,'REFERENCE');
 const candidate=compileEvidenceCapability(packet,plan);
 const observation=await executeCandidate(candidate,packet,plan);
 assert.match(observation.next_discriminating_question,/third reference family/i);
 assert.equal(observation.code_install_authorized,false);
});
test('source or plan forgery and candidate tampering cannot execute code',async()=>{
 const packet=source('Where is original source custody?',2);
 const plan=planEvidence(packet),c=compileEvidenceCapability(packet,plan);
 assert.throws(()=>compileEvidenceCapability(packet,{...plan,total_declared_cost:0}),/CHANGED/);
 assert.throws(()=>compileEvidenceCapability({...packet,private_material_accessed:true},plan),/INVALID/);
 await assert.rejects(executeCandidate({...c,source:c.source+' '},packet,plan),/INVALID/);
 await assert.rejects(executeCandidate({...c,production_installed:true},packet,plan),/INVALID/);
});
