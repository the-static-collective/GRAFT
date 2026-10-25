#!/usr/bin/env node
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {scout} from "./live-scout.mjs";
import {attend} from "./attend.mjs";
import {makeWorkPlan,writeWorkKit} from "./work-kit.mjs";

const NATIVE=new Set(["cut","world","depth","graph-depth","focus-world","question",
"blackstar-root","memento-root","freegraph-root","jarvis-root","cannon-root",
"planz-root","planz-garden-root","planz-table-root","planz-abundent-root",
"canon-bundle","canon-pins","canon-checkpoint"]);
const FLAGS=new Set([...NATIVE,"build-kit"]);
function options(argv){
 if(argv.length%2)throw Error("ARGUMENT_PAIRS_REQUIRED");
 const o={};
 for(let i=0;i<argv.length;i+=2){
  const key=argv[i].startsWith("--")?argv[i].slice(2):"";
  if(!FLAGS.has(key)||Object.hasOwn(o,key))throw Error("INVALID_OR_DUPLICATE_FLAG");
  o[key]=argv[i+1];
 }
 if(!o.question||o.question.length>500)throw Error("QUESTION_REQUIRED");
 return o;
}
export function assemble(question,now,history){
 const plan=makeWorkPlan(question,now,history);
 return {
  schema:"graft.jarvis-live-work/v1",question,
  fresh_public_evidence:now,
  historical_context:{
   source:"native pinned ATTEND-001",graph_packet_id:history?.free_graph?.packet_id||null,
   plan_shard_matches:history?.planz?.pinned_proposal_matches?.length||0,
   cannon_selection_state:history?.cannon?.status||"UNKNOWN",
   historical_data_is_not_current:true
  },
  work_plan:plan,
  disposition:"LOCAL_DRAFT_AVAILABLE_TO_BUILD",
  approval:"HUMAN_REQUIRED_FOR_EXTERNAL_EFFECTS",
  remote_writes:0,people_contacted:0,physical_actions:0,
  canon_changes:0,authority:"none"
 };
}
export async function runInitiative(argv,{fetcher,token,clock}={}){
 const o=options(argv),native=[];
 for(const [k,v] of Object.entries(o))if(NATIVE.has(k))native.push("--"+k,v);
 const historic=await attend(native);
 const now=await scout(o.question,{fetcher,token,clock});
 const body=assemble(o.question,now,historic);
 if(o["build-kit"]){
  const created=await writeWorkKit(o["build-kit"],body.work_plan,now);
  return {...body,disposition:"LOCAL_DRAFT_CREATED",
   executed:created.receipt,artifact_directory:created.dir};
 }
 return {...body,executed:{status:"NOT_REQUESTED",external_delivery:false}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.stdout.write(JSON.stringify(await runInitiative(process.argv.slice(2)),null,2)+"\n")}
 catch(e){process.stderr.write("REFUSED: "+String(e.message||"UNKNOWN")+"\n");process.exitCode=1}
}
