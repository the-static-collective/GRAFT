import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roots={
  "blackstar-root":process.env.GRAFT_BLACKSTAR_ROOT,
  "memento-root":process.env.GRAFT_MEMENTO_ROOT,
  "freegraph-root":process.env.GRAFT_FREEGRAPH_ROOT,
  "jarvis-root":process.env.GRAFT_JARVIS_ROOT,
  "cannon-root":process.env.GRAFT_CANNON_ROOT,
  "planz-root":process.env.GRAFT_PLANZ_ROOT,
};
if(Object.values(roots).some(v=>!v))throw Error("Need all six independently pinned checkouts");
function run(question="Neighbor",opts={}){
 const args=[join(root,"src","attend.mjs"),
 "--cut",join(root,"fixtures",opts.invalid?"future-in-early-cut.json":"early-cut.json"),
 "--world","same-room-a0","--depth","1","--graph-depth","1","--question",question];
 for(const [k,v] of Object.entries(roots))args.push("--"+k,opts[k]||v);
 for(const k of ["canon-bundle","canon-pins","canon-checkpoint"])if(opts[k])args.push("--"+k,opts[k]);
 return spawnSync(process.execPath,args,{encoding:"utf8",timeout:55000,maxBuffer:4*1024*1024});
}
test("five-organ read-only route gives source-grounded plan options, never a canon",()=>{
 const x=run();assert.equal(x.status,0,x.stderr);
 const v=JSON.parse(x.stdout);
 assert.equal(v.schema,"graft.jarvis-graph-cannon-planz/v1");
 assert.equal(v.disposition,"HOLD_FOR_OWNER_REVIEW");
 assert.equal(v.planz.matched_review_candidates.length,1);
 assert.equal(v.planz.matched_review_candidates[0].id,"REGIONAL-HELP-001");
 assert.equal(v.planz.matched_review_candidates[0].lane,"HELD");
 assert.equal(v.cannon.status,"UNKNOWN_NO_EXTERNAL_TRUST_PINS");
 assert.deepEqual(v.cannon.selections,[]);
 assert.equal(v.attention.native_jar_counts.needs,0);
 assert.equal(v.attention.external_delivery,false);
 assert.equal(v.free_graph.native_validation,"PASS");
 assert.equal(v.authority,"none");assert.equal(v.admission,"none");
 assert.equal(v.side_effects,"none");
});
test("question outside frozen sources abstains instead of fabricating",()=>{
 const r=run("How does the orange satellite encode giraffes?");
 assert.equal(r.status,0,r.stderr);
 const v=JSON.parse(r.stdout);
 assert.equal(v.planz.matched_review_candidates.length,0);
 assert.equal(v.free_graph.source_matches.length,0);
 assert.match(v.attention.answer,/No direct source match/);
});
test("proposed MEMENTO relationships are navigable, not owner canon",()=>{
 const v=JSON.parse(run("same-room").stdout);
 assert.ok(v.free_graph.graph_links>=3);
 assert.equal(v.free_graph.authority,"none");
 assert.equal(v.cannon.git_object_verified,false);
});
test("Black Star future knowledge refusal prevents generating a briefing",()=>{
 const r=run("Neighbor",{invalid:true});
 assert.notEqual(r.status,0);assert.equal(r.stdout,"");
 assert.match(r.stderr,/BLACK_STAR_VALIDATION_REFUSED/);
});
test("wrong planZ code revision refuses",()=>{
 const r=run("Neighbor",{"planz-root":root});
 assert.notEqual(r.status,0);assert.equal(r.stdout,"");
 assert.match(r.stderr,/PLANZ_REF_MISMATCH/);
});
test("CANNON rejects unsigned arbitrary selections rather than trusting branches",()=>{
 const dir=mkdtempSync(join(tmpdir(),"graft-canon-bad-"));
 try{
  const bundle=join(dir,"bundle.json"),pins=join(dir,"pins.json");
  writeFileSync(bundle,JSON.stringify({schema:"cannon.canon-bundle/v1",histories:[[{fake:true}]]}));
  writeFileSync(pins,JSON.stringify({schema:"cannon.owner-trust-pins/v1",owners:[]}));
  const r=run("Neighbor",{"canon-bundle":bundle,"canon-pins":pins});
  assert.notEqual(r.status,0);assert.equal(r.stdout,"");
  assert.match(r.stderr,/UNTRUSTED_OR_DUPLICATED_OWNER_HISTORY/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test("native CANNON can verify *synthetic* independent test pins without granting execution",async()=>{
 const mod=await import(pathToFileURL(join(roots["cannon-root"],"src","canon-field.mjs")).href);
 const owner=mod.newOwner();
 const body={
   schema:mod.EVENT_SCHEMA,owner_id:"synthetic-operator",seq:0,previous:null,
   occurred_at:"2026-10-25T12:00:00.000Z",scope:"graft:test",track:"experimental",
   action:"ADMIT",
   target:{repository:"the-static-collective/GRAFT",commit:"7ab34cd120c27a2dd7e037842a80eb768e320815",ref_hint:"fixture-only",evidence:["synthetic test"]},
   replaces:null,authority:"CANON_SELECTION_ONLY",public_key:owner.public_key
 };
 const ev=mod.signEvent(body,owner.private_key);
 const dir=mkdtempSync(join(tmpdir(),"graft-canon-good-"));
 try{
  const bundle=join(dir,"bundle.json"),pins=join(dir,"pins.json");
  writeFileSync(bundle,JSON.stringify({schema:mod.BUNDLE_SCHEMA,histories:[[ev]]}));
  writeFileSync(pins,JSON.stringify({schema:mod.PINS_SCHEMA,owners:[{owner_id:"synthetic-operator",public_key:owner.public_key}]}));
  const r=run("Neighbor",{"canon-bundle":bundle,"canon-pins":pins});
  assert.equal(r.status,0,r.stderr);
  const v=JSON.parse(r.stdout);
  assert.equal(v.cannon.selections.length,1);
  assert.equal(v.cannon.selections[0].authority,"CANON_SELECTION_ONLY");
  assert.equal(v.cannon.selections[0].effect_permission,false);
  assert.equal(v.cannon.status,"CALLER_PINNED_SIGNATURES_VERIFIED_NOT_OWNER_IDENTITY");
  assert.equal(v.side_effects,"none");
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test("same source snapshot produces deterministic grounded answers",()=>{
 const a=run("Neighbor"),b=run("Neighbor");
 assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
