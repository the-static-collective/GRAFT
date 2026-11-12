import test from "node:test";
import assert from "node:assert/strict";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {execFileSync} from "node:child_process";
const here=resolve(fileURLToPath(new URL("..",import.meta.url)));
const candidate=JSON.parse(await readFile(new URL("../candidate-holds/motif-reciprocal-004.json",import.meta.url),"utf8"));
const src=resolve(here,"_external/motif");
test("held donor metadata cannot resemble an accepted GRAFT transplant",()=>{
 assert.equal(candidate.schema,"graft.held-donor-proposal/v1");
 assert.equal(candidate.admission.state,"HELD_DONOR_REVIEW_ONLY");
 assert.equal(candidate.admission.decision,"NO_IMPORT");
 assert.equal(candidate.admission.codeCopiedIntoGraft,false);
 assert.equal(candidate.admission.originalHistoryCopied,false);
 assert.equal(candidate.admission.receiverOwnerMustReview,true);
 assert.equal(candidate.source.containsHumanData,false);
 assert.equal(candidate.source.exactCommit,"efb9fe46ebad1b0fc1da91bd7834b7c9fac00707");
 assert.ok(candidate.source.paths.every(x=>x.startsWith("experiments/reciprocal-00")));
});
test("check out real exact owner source before running a donor test",()=>{
 const head=execFileSync("git",["-C",src,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
 assert.equal(head,candidate.source.exactCommit);
});
test("native donor packet preserves source authority, does not import responses, and is deterministic",async()=>{
 const {buildCrosswire,validateCrosswire,freeGraphPacket}=await import(
  pathToFileURL(resolve(src,"experiments/reciprocal-004/ecosystem-crosswire.mjs")).href);
 const result=buildCrosswire(),graph=freeGraphPacket();
 assert.equal(validateCrosswire(result),true);
 assert.equal(result.crossing.status,"HOLD_FOR_OWNER_REVIEW");
 assert.equal(result.crossing.receiverMayAct,false);
 assert.equal(result.crossing.receiverMayAdmit,false);
 assert.equal(result.trial.strongMatchedClassical,"exact_tie");
 assert.equal(result.trial.importedHumanData,false);
 assert.equal(graph.schema,"free-graph.packet/v0");
 assert.ok(graph.links.every(x=>x.authority==="none"&&x.verb!=="constitutes"));
 assert.equal(graph.sources.length,2);
 assert.equal(graph.nodes.length,5);
 assert.equal(graph.links.length,4);
 const raw=JSON.stringify(result);
 assert.ok(!raw.includes("newcomer_fictional_"));
 assert.ok(!raw.includes("maker_fictional_"));
 assert.deepEqual(freeGraphPacket(),graph);
});
test("native donor output remains a revocable held local file, not a GRAFT auto-admitted candidate",async()=>{
 const tmp=await mkdtemp(join(tmpdir(),"graft-motif-held-"));
 try{
  const module=await import(pathToFileURL(resolve(src,"experiments/reciprocal-004/ecosystem-crosswire.mjs")).href);
  const result=module.writeArtifacts(tmp);
  const packet=JSON.parse(await readFile(resolve(tmp,"motif-reciprocal-crosswire.json"),"utf8"));
  const passport=JSON.parse(await readFile(resolve(tmp,"motif-reciprocal-passport.json"),"utf8"));
  assert.equal(result.sources,2);
  assert.equal(packet.crossing.automaticPromotion,false);
  assert.equal(passport.exchange.admissible,"PUBLIC_SYNTHETIC_FIXTURE_SUMMARY_ONLY");
  assert.ok(passport.neighboringDoors.every(x=>x.crossed===false));
 }finally{await rm(tmp,{recursive:true,force:true})}
});
