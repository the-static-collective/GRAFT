import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeCandidate,COMPILED_SOURCE,PINS}
 from '../src/motif021-composer.mjs';
import {
 executePublicSourceReview,executeLineageCaution,CAPABILITY,RECIPE
} from '../generated/motif021-source-review.mjs';
import {validateSavedPlan,solve} from '../vendor/planZ/motif-classical.mjs';

const raw=readFileSync(new URL('../inputs/MOTIF-021/alex-research-packet.json',import.meta.url));
const planned=readFileSync(new URL('../inputs/MOTIF-021/planz-classical-plan.json',import.meta.url));
const packet=JSON.parse(raw),plan=JSON.parse(planned);

test('actually copies and invokes exact original planZ source code',()=>{
 assert.equal(PINS['vendor/planZ/motif-classical.mjs'],
  '22d75c26039e5783b59cf71be02982428603128c');
 assert.equal(validateSavedPlan(plan,packet,raw),true);
 assert.equal(solve().cost,9);
});
test('compiler only accepts pinned ALEX and planZ byte cuts and closed recipes',()=>{
 const built=composeCandidate(raw,planned);
 assert.equal(built.status,'EXECUTABLE_CANDIDATE_HELD_FOR_OWNER_REVIEW');
 assert.equal(built.generated_module,'generated/motif021-source-review.mjs');
 assert.deepEqual(built.recipe,[...RECIPE]);
 assert.equal(built.evidence_admission,'NONE');
 assert.equal(built.external_effects,0);
 assert.equal(built.production_install,false);
 assert.equal(built.original_planz_classical_plan_replayed,true);
});
test('generated EXECUTABLE module exactly matches the composer, byte by byte',()=>{
 const generated=readFileSync(new URL('../generated/motif021-source-review.mjs',import.meta.url),'utf8');
 assert.equal(generated,COMPILED_SOURCE);
 assert.equal(generated,composeCandidate(raw,planned).source);
});
test('generated code runs and returns a source-locus candidate graph and explicit doubts',()=>{
 const r=executePublicSourceReview(packet,raw,plan);
 assert.equal(r.schema,'graft.motif021.public-source-review/v1');
 assert.equal(r.capability_id,CAPABILITY);
 assert.equal(r.materialized_source_count,5);
 assert.equal(r.search_hits_retained,12);
 assert.equal(r.cited_candidate_claims.length,5);
 assert.ok(r.cited_candidate_claims.every(x=>x.admitted_as_fact===false));
 assert.ok(r.cited_candidate_claims.some(x=>
  x.candidate_source_paths.some(y=>y.uninspected_in_query===true)));
 assert.equal(r.source_independence_verified,false);
 assert.equal(r.external_actions,0);
});
test('distinct source files are not asserted as independent original witnesses',()=>{
 const result=executeLineageCaution(packet,raw,plan);
 assert.equal(result.schema,'graft.motif021.lineage-caution/v1');
 assert.ok(result.distinct_materialized_file_origins>0);
 assert.ok(result.source_groups.every(x=>x.independence_status==='UNKNOWN'));
 assert.equal(result.causal_genealogy_inferred,false);
 assert.equal(result.original_source_custody_proved,false);
});
test('planZ execution trace remains a hypothetical simulation in generated code',()=>{
 const result=executePublicSourceReview(packet,raw,plan);
 assert.equal(plan.externally_executed_steps,0);
 assert.equal(plan.source_owner_approval,false);
 assert.equal(result.source_owner_approval,false);
 assert.equal(result.publication_authorized,false);
 assert.equal(result.promotion,'NONE');
});
test('tampered source bytes and fabricated rights are rejected before compilation',()=>{
 assert.throws(()=>composeCandidate(Buffer.concat([raw,Buffer.from(' ')]),planned),
  /STALE_OR_TAMPERED_SOURCE_CUT/);
 assert.throws(()=>composeCandidate(raw,Buffer.concat([planned,Buffer.from(' ')])),
  /STALE_OR_TAMPERED_SOURCE_CUT/);
 const mutated={...packet,restrictions:{...packet.restrictions,
  evidence_admission:'YES'}};
 assert.throws(()=>executePublicSourceReview(mutated,raw,plan),/INTAKE/);
});
test('forged classical action is not compiled or executed',()=>{
 const fake={...plan,actions:['AUTOMATIC_DEPLOY']};
 assert.throws(()=>executePublicSourceReview(packet,raw,fake),
  /CHANGED_OR_AUTHORITY_CLAIMING_PLAN/);
 assert.throws(()=>executeLineageCaution(packet,raw,{...plan,source_owner_approval:true}),
  /CHANGED_OR_AUTHORITY_CLAIMING_PLAN/);
});
test('search result records carry exact source pins, not invented page numbers',()=>{
 const r=executePublicSourceReview(packet,raw,plan);
 const paths=r.cited_candidate_claims.flatMap(c=>c.candidate_source_paths);
 assert.ok(paths.every(x=>x.git_blob.length===40&&x.source_commit.length===40));
 assert.ok(paths.every(x=>x.local_search_hits.every(y=>
  Number.isInteger(y.source_line)&&y.source_line>0)));
});
