import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,existsSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {scout} from "../src/live-scout.mjs";
import {makeWorkPlan,printableHtml,writeWorkKit} from "../src/work-kit.mjs";
import {assemble} from "../src/jarvis-initiative.mjs";

const OLD="0".repeat(40),NEW="a".repeat(40),OTHER="b".repeat(40);
const rows=[
 {repo:"planZ",branch:"proposal/test-grocery",path:"plans/grocery.md",
  title:"Community grocery opportunity",pin:OLD},
 {repo:"JAR-VIS",branch:"main",path:"README.md",
  title:"Original attendant source",pin:NEW}
];
function stub(failPath=""){
 const hits=[];
 const fetcher=async(url,args)=>{
  hits.push({url,auth:args.headers.Authorization});
  const u=new URL(url);
  assert.equal(u.hostname,"api.github.com");
  if(url.includes(failPath)&&failPath) return new Response("{}",{status:503});
  const branch=decodeURIComponent(u.pathname.split("/git/ref/heads/")[1]||"");
  if(branch){
    return new Response(JSON.stringify({ref:"refs/heads/"+branch,
      object:{sha:branch==="main"?NEW:NEW,type:"commit"}}),{status:200});
  }
  if(u.pathname.includes("/branches")){
   return new Response(JSON.stringify(u.pathname.includes("/planZ/")?
     [{name:"proposal/new-grocery-routing",commit:{sha:OTHER}},
      {name:"proposal/test-grocery",commit:{sha:NEW}}]:[]),{status:200});
  }
  if(u.pathname.includes("/git/trees/")){
   return new Response(JSON.stringify({truncated:false,tree:[
     {type:"blob",path:"docs/grocery-routing.md",size:90},
     {type:"blob",path:"README.md",size:50}]}),{status:200});
  }
  if(u.pathname.includes("/contents/")){
   assert.equal(u.searchParams.get("ref"),
     u.pathname.includes("routing")?OTHER:NEW);
   const body=u.pathname.includes("grocery")?
     "# Community grocery\n\n## Food supply\n\nDRAFT / HELD\n" :
     "# JAR;VIS\n\n## Current tools\n\nObserved.\n";
   return new Response(JSON.stringify({type:"file",encoding:"base64",
     content:Buffer.from(body).toString("base64")}),{status:200});
  }
  throw Error("Unexpected route: "+url);
 };
 return {fetcher,hits};
}
const clock=()=> "2026-10-25T13:00:00Z";
test("fresh project research resolves branch HEAD and fetches its exact revision",async()=>{
 const t=stub();
 const result=await scout("community grocery",{sources:rows,fetcher:t.fetcher,
   clock,token:"ephemeral-fixture-token"});
 assert.equal(result.schema,"graft.live-public-scout/v1");
 assert.equal(result.coverage.known_documents_read,2);
 assert.equal(result.observed_sources[0].head_sha,NEW);
 assert.equal(result.observed_sources[0].head_moved_since_snapshot,true);
 assert.equal(result.coverage.scope,"allowlisted_public_github_only");
 assert.ok(t.hits.some(x=>x.url.includes("/contents/plans/grocery.md?ref="+NEW)));
 assert.ok(!JSON.stringify(result).includes("ephemeral-fixture-token"));
});
test("new relevant branches are discovered beyond the supplied source inventory",async()=>{
 const r=await scout("grocery",{sources:rows,fetcher:stub().fetcher,clock});
 assert.ok(r.unexplored_branch_leads.some(x=>x.branch==="proposal/new-grocery-routing"));
 assert.equal(r.coverage.new_branch_docs_read,1);
 assert.ok(r.relevant_sources.some(x=>x.discovered_dynamically===true));
 assert.ok(r.relevant_sources.every(x=>x.current_owner_adoption==="UNVERIFIED"));
});
test("partial GitHub source failures are named, not silently treated as no records",async()=>{
 const r=await scout("grocery",{sources:rows,fetcher:stub("/contents/plans/grocery.md").fetcher,clock});
 assert.equal(r.coverage.known_documents_read,1);
 assert.ok(r.coverage.source_errors>0);
 assert.ok(r.errors.some(x=>x.branch==="proposal/test-grocery"));
 assert.equal(r.coverage.all_project_states_known,false);
});
test("plan becomes a concrete printable draft but not a field commitment",async()=>{
 const r=await scout("grocery",{sources:rows,fetcher:stub().fetcher,clock});
 const plan=makeWorkPlan("grocery",r);
 assert.equal(plan.proposal,"PRINT_AND_REVIEW_QUESTION_CARDS");
 assert.equal(plan.fulfillment,"NOT_CLAIMED");
 const html=printableHtml(plan);
 assert.match(html,/NEED/);
 assert.match(html,/OFFER/);
 assert.match(html,/RETURN/);
 assert.match(html,/observed|Observed/);
 assert.match(html,/Community grocery/);
});
test("question is escaped; fetched Markdown cannot inject executable HTML",async()=>{
 const r=await scout("grocery",{sources:rows,fetcher:stub().fetcher,clock});
 const p=makeWorkPlan('<script>alert("x")</script> grocery',r);
 const html=printableHtml(p);
 assert.ok(!html.includes('<script>alert("x")</script>'));
 assert.ok(html.includes("&lt;script&gt;"));
 assert.ok(!html.includes("https://evil.invalid"));
});
test("explicit local execution produces hash-receipted files and refuses overwrite",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"graft-execution-"));
 try{
  const r=await scout("grocery",{sources:rows,fetcher:stub().fetcher,clock});
  const p=makeWorkPlan("grocery",r);
  const output=join(dir,"packet");
  const z=await writeWorkKit(output,p,r);
  assert.equal(z.receipt.local_files_only,true);
  assert.equal(z.receipt.actual_people_contacted,0);
  assert.equal(z.receipt.external_delivery,false);
  const h=readFileSync(join(output,"field-kit.html"),"utf8");
  assert.equal(z.receipt.files[0].sha256,"sha256:"+createHash("sha256").update(h).digest("hex"));
  assert.ok(existsSync(join(output,"work-plan.json")));
  assert.ok(existsSync(join(output,"work-receipt.json")));
  await assert.rejects(()=>writeWorkKit(output,p,r),/EEXIST/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test("empty public evidence cannot be described as completed research",async()=>{
 const r=await scout("grocery",{sources:rows,fetcher:stub("/git/ref/heads/").fetcher,clock});
 assert.equal(r.coverage.known_documents_read,0);
 const p=makeWorkPlan("grocery",r);
 const dir=mkdtempSync(join(tmpdir(),"graft-no-source-"));
 try{await assert.rejects(()=>writeWorkKit(join(dir,"kit"),p,r),/NO_PUBLIC_SOURCE_READ/)}
 finally{rmSync(dir,{recursive:true,force:true})}
});
test("assembly maintains distinct history, research and actual local action gates",async()=>{
 const current=await scout("grocery",{sources:rows,fetcher:stub().fetcher,clock});
 const old={free_graph:{packet_id:"fgp:sha256:"+"e".repeat(64)},
  planz:{pinned_proposal_matches:[{source_url:"test"}]},cannon:{status:"UNKNOWN_NO_EXTERNAL_TRUST_PINS"}};
 const o=assemble("grocery",current,old);
 assert.equal(o.historical_context.historical_data_is_not_current,true);
 assert.equal(o.remote_writes,0);assert.equal(o.people_contacted,0);
 assert.equal(o.canon_changes,0);assert.equal(o.work_plan.authority,"none");
});
