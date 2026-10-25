#!/usr/bin/env node
/**
 * JAR;VIS × GRAFT × Free Graph × planZ × CANNON.
 *
 * Native pinned code, no network, actions, real consent, global canon or writes.
 * This is a source-aware attendant *reader*, not a hosted Ask JAR;VIS endpoint.
 */
import {createHash} from "node:crypto";
import {readFileSync, statSync} from "node:fs";
import {resolve, join} from "node:path";
import {pathToFileURL, fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {freeGraphReconstruction} from "./free-graph.mjs";

export const PINNED = Object.freeze({
  jarvis:"35b3843c13ab1994efc913724b1db08ce79bdeed",
  cannon:"453cf70c820a114423811cecdc70b4ec06f2675b",
  planz:"52183eafe0daf311582c6016b37805ae24ef4ec6",
  blackstar:"08f42f769f9590d78b85c8d84358e1791d5bd318",
  memento:"22a5714f25c7be59bac37b3ab691c28c1f036845",
  freegraph:"ec0ad8743c5faac3f3675760bbafcbcb1df846c1"
});
const ALLOWED=new Set(["cut","world","depth","graph-depth","focus-world","question",
  "blackstar-root","memento-root","freegraph-root","jarvis-root","cannon-root",
  "planz-root","canon-bundle","canon-pins","canon-checkpoint"]);
const REQUIRED=["cut","world","blackstar-root","memento-root","freegraph-root","jarvis-root","cannon-root","planz-root"];
const STOP=new Set(["what","when","where","which","about","with","from","into","that","there","have","could","would","should","we","the","and","this","then","make","next","plan","plans","project","projects","some","show","tell"]);
function refuse(code){throw Error(code)}
function parse(argv){
 if(argv.length%2)refuse("EXPECTED_FLAG_VALUE_PAIRS");
 const o={};
 for(let i=0;i<argv.length;i+=2){
   const k=argv[i].startsWith("--")?argv[i].slice(2):"";
   if(!ALLOWED.has(k)||Object.hasOwn(o,k))refuse("UNEXPECTED_OR_DUPLICATE_ARGUMENT");
   o[k]=argv[i+1];
 }
 for(const k of REQUIRED)if(!o[k])refuse("MISSING_"+k.toUpperCase().replaceAll("-","_"));
 if(o["canon-bundle"]&&!o["canon-pins"]||o["canon-pins"]&&!o["canon-bundle"])refuse("CANON_BUNDLE_AND_INDEPENDENT_PINS_REQUIRED");
 if(o["canon-checkpoint"]&&!o["canon-pins"])refuse("CANON_CHECKPOINT_REQUIRES_PINS");
 if(typeof o.question!=="string"||!o.question.trim()||o.question.length>500)refuse("QUESTION_MUST_BE_1_TO_500_CHARS");
 return o;
}
function pin(root,expected,label){
 let out;
 try{out=execFileSync("git",["-C",resolve(root),"rev-parse","HEAD"],{encoding:"utf8",timeout:5000,stdio:["ignore","pipe","ignore"]}).trim();}
 catch{refuse(label+"_UNVERIFIED_CHECKOUT")}
 if(out!==expected)refuse(label+"_REF_MISMATCH");
 return resolve(root);
}
function localJson(path,max=1024*1024){
 try{
  const st=statSync(resolve(path));
  if(!st.isFile()||st.size>max)refuse("INVALID_LOCAL_SOURCE_SIZE");
  return JSON.parse(readFileSync(resolve(path),"utf8"));
 }catch{refuse("LOCAL_SOURCE_UNREADABLE_OR_INVALID")}
}
function digestJson(v){return "sha256:"+createHash("sha256").update(JSON.stringify(v)).digest("hex")}
function tokens(q){return [...new Set((q.toLowerCase().match(/[a-z0-9]{4,}/g)||[]).filter(w=>!STOP.has(w)))].slice(0,24)}
function suggest(board,q){
 const ts=tokens(q);
 const out=board.records.filter(r=>{
   const hay=[r.id,r.title,r.next].join(" ").toLowerCase();
   return ts.some(t=>hay.includes(t));
 }).slice(0,8);
 return out.map(r=>({
   id:r.id,title:r.title,phase:r.phase,lane:r.lane,source:r.source,
   next_as_written:r.next,disposition:"NOT_CONFIRMED",
   proposal_status:"REVIEW_CANDIDATE_ONLY",currentness:"BOARD_SNAPSHOT_ONLY"
 }));
}
function matchingWorlds(packet,q) {
 const ts=tokens(q);
 return packet.nodes.filter(n=>ts.some(t=>(n.label+" "+(n.world_key||"")).toLowerCase().includes(t)))
  .slice(0,8).map(n=>({label:n.label,kind:n.kind,status:n.status,
    authority:"none",node_id:n.id}));
}
export async function attend(argv){
 const o=parse(argv);
 const roots={
  jarvis:pin(o["jarvis-root"],PINNED.jarvis,"JARVIS"),
  cannon:pin(o["cannon-root"],PINNED.cannon,"CANNON"),
  planz:pin(o["planz-root"],PINNED.planz,"PLANZ")
 };
 // The original Free Graph bridge checks the three other native code pins.
 const args=[];
 for(const key of ["cut","world","depth","graph-depth","focus-world","blackstar-root","memento-root","freegraph-root"]) {
  if(o[key]!==undefined)args.push("--"+key,o[key]);
 }
 const graph=freeGraphReconstruction(args);
 const j=await import(pathToFileURL(join(roots.jarvis,"src","engine.mjs")).href);
 const d=await import(pathToFileURL(join(roots.jarvis,"src","doors.mjs")).href);
 if(typeof j.Jar!=="function"||typeof j.observe!=="function"||!Array.isArray(d.doors))refuse("JARVIS_NATIVE_CONTRACT_CHANGED");
 // A blank native JAR is deliberate: we never load its fictional Garden fixture as real community data.
 const observed=j.observe(new j.Jar([]));
 if(observed.needs.length||observed.offers.length)refuse("JARVIS_UNVERIFIED_PARTICULARS");
 const phase=await import(pathToFileURL(join(roots.planz,"phaselift","engine.mjs")).href);
 const board=localJson(join(roots.planz,"phaselift","board.json"));
 if(phase.checkBoard(board)!==true)refuse("PLANZ_NATIVE_BOARD_INVALID");
 if(board.schema!=="phaselift.board.v0")refuse("PLANZ_BOARD_SCHEMA_MISMATCH");
 const boardHash=await phase.sha256Text(JSON.stringify(board));
 const canon=await import(pathToFileURL(join(roots.cannon,"src","canon-field.mjs")).href);
 let bundle={schema:canon.BUNDLE_SCHEMA,histories:[]};
 let pins={schema:canon.PINS_SCHEMA,owners:[]};
 let checkpoint;
 if(o["canon-bundle"]){
  bundle=localJson(o["canon-bundle"]);
  pins=localJson(o["canon-pins"]);
  if(o["canon-checkpoint"])checkpoint=localJson(o["canon-checkpoint"]);
 }
 // project() verifies Ed25519 owner sequences against *caller-supplied* pins,
 // and refuses bad signatures. It never substitutes "main" as canonical.
 const projection=checkpoint?canon.project(bundle,pins,checkpoint):canon.project(bundle,pins);
 if(projection.schema!=="cannon.canon-projection/v1"||projection.deployment_grants!==0
  ||projection.physical_execution_grants!==0||projection.automatic_merges!==0)refuse("CANNON_AUTHORITY_VIOLATION");
 const planMatches=suggest(board,o.question);
 const graphMatches=matchingWorlds(graph.free_graph_packet,o.question);
 const selected=projection.active.map(x=>({
  owner_id:x.owner_id,scope:x.scope,track:x.track,repository:x.repository,
  commit:x.commit,selection_event_hash:x.selection_event_hash,
  authority:x.authority,source_code_verified:x.git_object_verified,
  effect_permission:false
 }));
 const noPins=pins.owners.length===0;
 const answer=graphMatches.length||planMatches.length
  ?"Source matches found. They are historical or plan-board candidates, not approved actions."
  :"No direct source match for this question in the pinned graph or plan-board cut. Widen research before asserting a connection.";
 return {
  schema:"graft.jarvis-graph-cannon-planz/v1",
  question:o.question,
  disposition:"HOLD_FOR_OWNER_REVIEW",
  attention:{
    schema:"jarvis.attention-handoff/v1",
    answer,
    mode:"native-deterministic-source-routing",
    operator_identity:"none",
    external_delivery:false,
    simulated_fixtures_excluded:true,
    native_jar_counts:{needs:observed.needs.length,offers:observed.offers.length},
    source_doors:d.doors.filter(x=>["planz","abundent","ghot"].includes(x.id))
      .map(x=>({id:x.id,connected:x.connected,status:x.status})),
  },
  free_graph:{
    packet_id:graph.navigation.packet_id,
    neighborhood_packet_id:graph.navigation.neighborhood_packet_id,
    native_validation:"PASS",
    graph_nodes:graph.free_graph_packet.nodes.length,
    graph_links:graph.free_graph_packet.links.length,
    source_matches:graphMatches,
    source_authors:"original pinned Black Star / MEMENTO / Free Graph",
    authority:"none",
  },
  planz:{
    source_ref:PINNED.planz,
    phase_board_snapshot_sha256:boardHash,
    snapshot_as_of:board.as_of,
    total_snapshot_records:board.records.length,
    matched_review_candidates:planMatches,
    review_gate:"LOCAL_ONLY_NOT_CALLED",
    status:"SNAPSHOT_NOT_CURRENT_OWNER_PLAN",
  },
  cannon:{
    source_ref:PINNED.cannon,
    native_verifier:"PROJECT",
    status:noPins?"UNKNOWN_NO_EXTERNAL_TRUST_PINS":"CALLER_PINNED_SIGNATURES_VERIFIED_NOT_OWNER_IDENTITY",
    selections:selected,
    conflict_count:projection.conflicts.length,
    historical_events_count:projection.historical_events.length,
    trusted_owner_count:pins.owners.length,
    git_object_verified:false,
    deployment_grants:0,
    owner_selection_is_not_execution:true,
  },
  proposed_next:{
    summary:planMatches.length?"Review the matched planZ card and its original source before making a local decision.":"Identify a relevant current owner source and exact evidence cut; do not invent a plan.",
    candidates:planMatches.map(x=>({plan_id:x.id,possible_next:x.next_as_written,gate:"UNREQUESTED"})),
    follow_up:"Consult owning project and human gate for new evidence. No remote search or local write was attempted."
  },
  origin:{
    pinned:PINNED,
    graph_reconstruction_sha256:digestJson(graph.navigation),
    data_limit:"one frozen synthetic MEMENTO world graph plus a pinned planZ PhaseLift snapshot",
  },
  authority:"none",
  admission:"none",
  side_effects:"none",
  no_network:true
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.stdout.write(JSON.stringify(await attend(process.argv.slice(2)),null,2)+"\n")}
 catch(e){process.stderr.write("REFUSED: "+String(e.message||"UNKNOWN")+"\n");process.exitCode=1}
}
