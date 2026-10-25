import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

// Actual local execution: create a printable packet, never enroll or contact people.
const hash=s=>"sha256:"+createHash("sha256").update(s).digest("hex");
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const QUESTIONS={
  food:["What food-access need is observed?","What food, transport, storage, or coordination capacity could someone voluntarily offer?","Which grocery-project steward could review the question?"],
  music:["What small musical gathering would be useful?","What venue, equipment, or organizing help might a willing host offer?","Who can actually approve the particular gathering?"],
  stewardship:["What local place genuinely needs attention?","What capacity could a willing steward contribute?","What safety and property permission is required?"],
  general:["What one unresolved need is worth clarifying?","What resource, capability, or knowledge can someone freely offer?","What is a small, reversible next experiment?"]
};
export function makeWorkPlan(question,scout,history={}){
 if(scout?.schema!=="graft.live-public-scout/v1")throw Error("CURRENT_RESEARCH_REQUIRED");
 const q=question.toLowerCase();
 const focus=/food|grocery|produce|kitchen|pantry/.test(q)?"food":
   /music|worship|church|concert|festival|artist/.test(q)?"music":
   /cleanup|trash|park|conservation|steward/.test(q)?"stewardship":"general";
 const relevant=scout.relevant_sources.slice(0,6);
 return {
  schema:"graft.useful-work-plan/v1",
  question,focus,
  title:{food:"Food access: three questions",music:"Music gathering: three questions",stewardship:"Stewardship: three questions",general:"Community: three questions"}[focus],
  observed_at:scout.observed_at,
  original_source_refs:relevant.map(s=>({title:s.title,url:s.source_url,sha:s.head_sha,digest:s.source_sha256,owner_adoption:"UNKNOWN"})),
  historical_plan_count:history.planz?.matched_review_candidates?.length||0,
  proposal:"PRINT_AND_REVIEW_QUESTION_CARDS",
  next_24h:"Produce one printed packet and ask a willing steward to improve or decline the questions.",
  approval_for_communication:"NOT_REQUESTED",
  human_gate:"REQUIRED_BEFORE_DISTRIBUTION_OR_ACTUAL_FIELD_WORK",
  fulfillment:"NOT_CLAIMED",authority:"none"
 };
}
function card(i,title,question){
 return ['<section class="card"><span class="number">',i,'</span><h2>',esc(title),'</h2><p>',esc(question),
 '</p><div class="line">Possible response:</div><div class="line">Permission / source / date:</div></section>'].join("");
}
export function printableHtml(plan){
 if(plan?.schema!=="graft.useful-work-plan/v1")throw Error("PLAN_INVALID");
 const q=QUESTIONS[plan.focus]||QUESTIONS.general;
 const refs=plan.original_source_refs.map(s=>'<li><a href="'+esc(s.url)+'">'+esc(s.title)+'</a> · exact commit '+esc(s.sha.slice(0,12))+' · current owner adoption UNKNOWN</li>').join("");
 return [
 '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>',esc(plan.title),'</title><style>',
 'body{font:11pt/1.35 system-ui,sans-serif;color:#17291a;max-width:8in;margin:0 auto;padding:.25in}h1,h2{font-family:Georgia,serif}',
 'header{border-top:6px solid #386a45;border-bottom:2px solid #386a45;padding:12px 0}h1{font-size:25pt;margin:6px 0}',
 '.tiny{font-size:8pt;letter-spacing:1.5px;color:#356b45}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
 '.card{border:1.3px dashed #799c7e;padding:12px;min-height:2.2in;break-inside:avoid}.card h2{font-size:16pt}.card p{min-height:.45in}',
 '.line{padding:14px 0 4px;border-bottom:1px solid #9cae9e;font-size:9pt}.number{background:#d8ead9;padding:3px 8px}',
 '.refs{font-size:8pt;overflow-wrap:anywhere}.refs li{margin-bottom:4px}.notice{padding:8px;background:#e8f0e7}',
 '@page{size:letter;margin:.35in}@media print{body{padding:0}}@media(max-width:560px){.grid{grid-template-columns:1fr}}',
 '</style></head><body><header><div class="tiny">JAR;VIS × GRAFT · LOCAL WORK KIT · REVIEW REQUIRED</div><h1>',
 esc(plan.title),'</h1><b>Starting question: </b>',esc(plan.question),'</header>',
 '<p class="notice">',esc(plan.next_24h),
 ' Not a request for someone to work, not a partnership commitment, and not permission to publish contacts.</p>',
 '<div class="grid">',card("01","NEED",q[0]),card("02","OFFER",q[1]),
 card("03","BUILD",q[2]),card("04","RETURN","What did we learn? What remains unknown? Who can choose the next step?"),'</div>',
 '<section class="refs"><h3>Attributable public source doors</h3><p>Observed ',esc(plan.observed_at),
 '. Read exact source before acting. A branch is not canon.</p><ol>',refs||'<li>No relevant public source was found; research further.</li>',
 '</ol></section><footer class="tiny">NO AUTOMATIC CONSENT · NO FIELD FULFILLMENT CLAIMED · KEEP PRIVATE DATA PRIVATE</footer></body></html>'
 ].join("");
}
export async function writeWorkKit(outDir,plan,scout){
 if(typeof outDir!=="string"||!outDir.trim()||outDir.length>450)throw Error("EXPLICIT_OUTPUT_DIRECTORY_REQUIRED");
 if(scout.coverage.known_documents_read<1)throw Error("NO_PUBLIC_SOURCE_READ");
 const dir=resolve(outDir),html=printableHtml(plan);
 const planText=JSON.stringify(plan,null,2)+"\n";
 const receipt={
  schema:"graft.local-work-receipt/v1",action:"CREATE_PRINTABLE_QUESTION_KIT",
  local_files_only:true,external_delivery:false,
  actual_people_contacted:0,real_world_fulfillment:"NOT_ESTABLISHED",
  site_deployment:false,consent_or_permission:"NOT_REQUESTED",
  source_observed_at:scout.observed_at,
  coverage:scout.coverage,read_errors:scout.errors,
  files:[{name:"field-kit.html",sha256:hash(html),bytes:Buffer.byteLength(html)},
    {name:"work-plan.json",sha256:hash(planText),bytes:Buffer.byteLength(planText)}],
  authority:"none"
 };
 // Fail if existing: operator must deliberately choose a new occurrence.
 await mkdir(dir,{recursive:false});
 await writeFile(dir+"/field-kit.html",html,{flag:"wx",mode:0o600});
 await writeFile(dir+"/work-plan.json",planText,{flag:"wx",mode:0o600});
 await writeFile(dir+"/work-receipt.json",JSON.stringify(receipt,null,2)+"\n",{flag:"wx",mode:0o600});
 return {dir,receipt};
}
