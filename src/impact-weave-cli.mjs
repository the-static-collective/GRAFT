#!/usr/bin/env node
// Explicit operator-only local files. Never requests data from Firebox or performs network actions.
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {buildImpactWeave,renderImpactTable,INTENT,ACK,WEAVE_DISPOSITION} from "./impact-weave.mjs";
import {printableHtml} from "./work-kit.mjs";

function digest(text){return "sha256:"+createHash("sha256").update(text).digest("hex");}
function parseArgs(argv){
  if(argv.length!==4 || !["--lanes","--output-directory"].includes(argv[0]) ||
      !["--lanes","--output-directory"].includes(argv[2]) || argv[0]===argv[2] ||
      argv.some(x=>typeof x!=="string"))throw Error("USE_EXACT_FLAGS_--lanes_AND_--output-directory");
  return {[argv[0]]:argv[1],[argv[2]]:argv[3]};
}
export async function runImpactWeave(argv){
  const args=parseArgs(argv);
  const laneNames=args["--lanes"].split(",");
  const plan=buildImpactWeave({purpose:INTENT,acknowledgement:ACK,lanes:laneNames});
  if(plan.status!==WEAVE_DISPOSITION)throw Error("WEAVE_REFUSED_"+plan.reason);
  const directory=resolve(args["--output-directory"]);
  if(!args["--output-directory"].trim() || args["--output-directory"].length>350 ||
      directory===process.cwd())throw Error("EXPLICIT_NEW_PRIVATE_DIRECTORY_REQUIRED");

  // Native GRAFT work-kit renderer is actually used. There is *no public scout
  // run*, so the source list is deliberately empty and date not asserted.
  const nativeDraft={
    schema:"graft.useful-work-plan/v1",
    focus:"stewardship",title:"The Right Hands: one useful next move",
    question:"How might willing adults help one another without transferring authority or beneficiary history?",
    next_24h:"Ask two independent adult stewards whether a single non-personal cooperation question is welcome.",
    observed_at:"NOT_OBSERVED_STATIC_SCENARIO",original_source_refs:[]
  };
  const files={
    "impact-weave.json":JSON.stringify(plan,null,2)+"\n",
    "right-hands.html":renderImpactTable(plan),
    "graft-native-four-cards.html":printableHtml(nativeDraft)
  };
  const receipt={
    schema:"graft.impact-weave-local-receipt/v0",
    status:"LOCAL_DRAFT_PREPARED",
    original_graft_four_card_renderer_used:true,
    input_scope:"STATIC_PUBLIC_SAFE_ROLE_VOCABULARY_ONLY",
    real_source_observed:false,
    external_calls:0,people_contacted:0,
    partner_permissions:0,actual_volunteers:0,verified_acts:0,
    files:Object.entries(files).map(([name,body])=>({name,bytes:Buffer.byteLength(body),sha256:digest(body)})),
    authority:"none"
  };
  files["work-receipt.json"]=JSON.stringify(receipt,null,2)+"\n";
  await mkdir(directory,{mode:0o700});
  for(const [name,body] of Object.entries(files)){
    await writeFile(resolve(directory,name),body,{flag:"wx",mode:0o600});
  }
  return {state:plan.status,routeCount:plan.route_count,directory,receipt};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try {console.log(JSON.stringify(await runImpactWeave(process.argv.slice(2)),null,2));}
  catch(error){console.error("REFUSED:",error.message);process.exitCode=1;}
}
