/**
 * LIVE-SCOUT-002: fresh public-source research for JAR;VIS, bounded to
 * expressly permitted GitHub org/repositories. Neither prompt instructions
 * nor retrieved Markdown ever become executable commands.
 *
 * Do not confuse a current branch head with selected CANNON canon.
 */
import {createHash} from "node:crypto";

const ORG="the-static-collective";
const SHA=/^[a-f0-9]{40}$/;
const PATH=/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.md$/;
const BRANCH=/^[a-z0-9][a-z0-9._/-]{0,119}$/i;
const STOP=new Set(["this","that","from","what","which","where","when","could","would","should","with","then","into","about","some","there","their","please","tell","show","want","need","your","mine","make","next","work","plan","plans","the","and","are","our","for","can","how","does","have"]);
const SOURCES=Object.freeze([
 {repo:"GRAFT",branch:"main",path:"README.md",title:"GRAFT current public index",pin:null},
 {repo:"JAR-VIS",branch:"main",path:"README.md",title:"JAR;VIS current public runtime",pin:"35b3843c13ab1994efc913724b1db08ce79bdeed"},
 {repo:"planZ",branch:"main",path:"README.md",title:"planZ owner-index root",pin:"dad6593c3718c65fa4bb7a3650af8fc80d060ce6"},
 {repo:"planZ",branch:"proposal/common-table-waseca-grand-plan-001",path:"plans/2026-10-21-common-table-waseca-grand-plan-001.md",
   title:"Common Table Waseca proposed grocery + arts commons",pin:"e57b227242d64d4e485540f6406ec63d21407e3c"},
 {repo:"planZ",branch:"proposal/the-garden-master-shard-001",path:"plans/2026-10-21-the-garden-master-shard-001.md",
   title:"Garden master shard: home stewardship and cultivation",pin:"d0bcdf7d9fc40eef59deed560057c8579a69cb2a"},
 {repo:"planZ",branch:"plan/abundent-field-grand-shard-001",path:"grand-shards/2026-10-21-abundent-field-common-goods-hands-001.md",
   title:"Abundent field and community card routing proposal",pin:"1ec9a4043b150296e0d90796fae5e5cc02ba3dcc"},
 {repo:"planZ",branch:"proposal/revival-traveling-jubilee-topper-001",path:"layers/2026-10-11-revival-traveling-jubilee-topper-001.md",
   title:"Traveling music and community gatherings proposal",pin:"686c8df2bec928a83c05b3198fb4898c663e22f4"},
 {repo:"CANNON",branch:"main",path:"README.md",title:"CANNON selection constitution",pin:"62a557389013155c07e4d98578cbfb560f5f59c5"},
 {repo:"CANNON",branch:"experiment/stack-squared-028-first-contact-field-door",path:"docs/STACK-SQUARED-028-FIRST-CONTACT-FIELD.md",
   title:"CANNON first-contact field experiment",pin:"2152730d1b300933ce484f455bbdb2da4ab09dd3"},
 {repo:"webZ",branch:"main",path:"README.md",title:"webZ current published code root",pin:null},
 {repo:"free-graph",branch:"main",path:"README.md",title:"Free Graph current code root",pin:"ec0ad8743c5faac3f3675760bbafcbcb1df846c1"},
]);
const REPOS=new Set(SOURCES.map(s=>s.repo));
const READ_BRANCHES=["planZ","CANNON","JAR-VIS","webZ"];
const hash=s=>"sha256:"+createHash("sha256").update(s).digest("hex");
const term=q=>[...new Set((q.toLowerCase().match(/[a-z0-9]{4,}/g)||[]).filter(x=>!STOP.has(x)))].slice(0,20);
function wordsForMatch(s){return s.toLowerCase().replace(/[^a-z0-9]/g," ");}
function matchScore(words,doc){
 const hay=wordsForMatch(doc);
 return words.reduce((t,w)=>t+(hay.includes(w)?1:0),0);
}
function exactHeadings(body){
 return body.split("\n").filter(l=>/^#{1,3} /u.test(l)).map(l=>l.replace(/^#{1,3} /,"").trim().slice(0,110)).slice(0,24);
}
function sourceState(body){
 const start=body.slice(0,2200).toUpperCase();
 if(/\bNOT CANON\b|\bDRAFT\b|\bPROPOSED\b|\bHELD\b/.test(start))return "PROPOSAL_OR_HELD_AT_SOURCE";
 return "NO_OWNER_ADOPTION_INFERRED";
}
function safeRepo(v){if(!REPOS.has(v))throw Error("REPOSITORY_NOT_ALLOWLISTED");return v}
function safeBranch(v){if(!BRANCH.test(v)||v.includes("..")||v.includes("//"))throw Error("INVALID_BRANCH");return v}
function safePath(v){if(!PATH.test(v)||v.includes(".."))throw Error("INVALID_DOCUMENT_PATH");return v}
function urlFor(repo,suffix){
 safeRepo(repo);
 return "https://api.github.com/repos/"+ORG+"/"+repo+"/"+suffix;
}
function apiPathBranch(branch){return safeBranch(branch).split("/").map(encodeURIComponent).join("/")}
async function readApi(url,{fetcher,token}){
 const u=new URL(url);
 if(u.protocol!=="https:"||u.hostname!=="api.github.com"||u.port)throw Error("UNAPPROVED_RESEARCH_HOST");
 const ctrl=new AbortController();
 const timer=setTimeout(()=>ctrl.abort(),11000);
 try{
  const headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",
      "User-Agent":"GRAFT-live-scout-002"};
  if(token)headers.Authorization="Bearer "+token;
  const r=await fetcher(url,{headers,signal:ctrl.signal,redirect:"error"});
  if(!r||typeof r.status!=="number"||typeof r.text!=="function")throw Error("FETCH_INVALID_RESPONSE");
  if(!r.ok)throw Error("GITHUB_HTTP_"+r.status);
  const body=await r.text();
  if(body.length>500000)throw Error("SOURCE_API_TOO_LARGE");
  return JSON.parse(body);
 }finally{clearTimeout(timer)}
}
async function discoverRef(repo,branch,ctx){
 const json=await readApi(urlFor(repo,"git/ref/heads/"+apiPathBranch(branch)),ctx);
 if(json.ref!=="refs/heads/"+branch||!SHA.test(json.object?.sha)||json.object?.type!=="commit")
   throw Error("REF_RESPONSE_UNVERIFIED");
 return json.object.sha;
}
async function readMarkdown(repo,branch,path,commit,ctx){
 safePath(path);
 const uri=urlFor(repo,"contents/"+path+"?ref="+commit);
 const json=await readApi(uri,ctx);
 if(json.type!=="file"||json.encoding!=="base64"||
     typeof json.content!=="string"||!SHA.test(commit))throw Error("CONTENT_RESPONSE_UNVERIFIED");
 const bytes=Buffer.from(json.content.replace(/\s/g,""),"base64");
 if(bytes.length>100000)throw Error("SOURCE_DOCUMENT_TOO_LARGE");
 const body=bytes.toString("utf8");
 if(body.includes("\uFFFD"))throw Error("SOURCE_DOCUMENT_INVALID_UTF8");
 return {body,doc_hash:hash(bytes)};
}
function sourceRecord(s,head,doc,words,discovered=false){
 const headings=exactHeadings(doc.body);
 const matched=matchScore(words,[s.title,s.path,...headings].join(" ")) + 
               matchScore(words,doc.body.slice(0,24000))*0.25;
 return {
  repo:s.repo,branch:s.branch,head_sha:head,was_snapshot_ref:s.pin||null,
  head_moved_since_snapshot:s.pin?head!==s.pin:null,
  title:s.title,path:s.path,
  source_url:"https://github.com/"+ORG+"/"+s.repo+"/blob/"+head+"/"+s.path,
  source_sha256:doc.doc_hash,source_state_at_observation:sourceState(doc.body),
  current_owner_adoption:"UNVERIFIED",
  headings,topic_score:Math.round(matched*100)/100,
  discovered_dynamically:discovered,
  evidence_kind:"public_git_blob_observed_at_head",
 };
}
function branchMatches(data,repo,words,known){
 if(!Array.isArray(data))throw Error("BRANCH_LIST_INVALID");
 return data.filter(b=>b&&typeof b.name==="string"&&safeBranch(b.name) &&
   SHA.test(b.commit?.sha)&&!known.has(repo+"#"+b.name))
   .map(b=>({repo,branch:b.name,head_sha:b.commit.sha,
             topic_score:matchScore(words,b.name),state:"UNINSPECTED_BRANCH_LEAD",
             source_url:"https://github.com/"+ORG+"/"+repo+"/tree/"+b.commit.sha}))
   .filter(b=>b.topic_score>0)
   .sort((a,b)=>b.topic_score-a.topic_score||a.branch.localeCompare(b.branch));
}
/** Evidence is a dated public observation, never CANNON selection or a permission. */
export async function scout(question,{
 fetcher=globalThis.fetch,token=process.env.GITHUB_TOKEN||"",
 clock=()=>new Date().toISOString(),sources=SOURCES
}={}){
 if(typeof question!=="string"||!question.trim()||question.length>500)throw Error("QUESTION_INVALID");
 const words=term(question),observed_at=clock();
 if(!Number.isFinite(Date.parse(observed_at)))throw Error("OBSERVATION_CLOCK_INVALID");
 const ctx={fetcher,token},documents=[],errors=[],leads=[];
 const known=new Set(sources.map(s=>s.repo+"#"+s.branch));
 for(const s of sources){
  try{
   const head=await discoverRef(s.repo,s.branch,ctx);
   const doc=await readMarkdown(s.repo,s.branch,s.path,head,ctx);
   documents.push(sourceRecord(s,head,doc,words));
  }catch(err){errors.push({repo:s.repo,branch:s.branch,code:String(err.message).slice(0,90)})}
 }
 // Explore branch names not in the fixed manifest: this is new discovery,
 // without assuming content, actor consent or an owner's canonical selection.
 for(const repo of READ_BRANCHES){
  try{
   const branches=await readApi(urlFor(repo,"branches?per_page=100"),ctx);
   leads.push(...branchMatches(branches,repo,words,known).slice(0,5));
  }catch(err){errors.push({repo,branch:"<branch-discovery>",code:String(err.message).slice(0,90)})}
 }
 leads.sort((a,b)=>b.topic_score-a.topic_score||a.repo.localeCompare(b.repo));
 const dynamic=[];
 // Inspect one newly discovered relevant branch. File path derives solely
 // from the verified Git tree, with no arbitrary URL or prompt-based fetch.
 for(const lead of leads.slice(0,2)){
  try{
   const tree=await readApi(urlFor(lead.repo,"git/trees/"+lead.head_sha+"?recursive=1"),ctx);
   if(!Array.isArray(tree.tree)||tree.truncated||tree.tree.length>1800)
    throw Error("DISCOVERED_TREE_INCOMPLETE");
   const choices=tree.tree.filter(f=>f.type==="blob"&&typeof f.path==="string" &&
     PATH.test(f.path)&&!f.path.includes("..") &&
     f.path!=="README.md"&&f.size<=90000)
     .map(f=>({path:f.path,score:matchScore(words,f.path)}))
     .sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
   if(!choices.length||choices[0].score===0)continue;
   const file=choices[0].path;
   const body=await readMarkdown(lead.repo,lead.branch,file,lead.head_sha,ctx);
   dynamic.push(sourceRecord({repo:lead.repo,branch:lead.branch,path:file,
     title:"Discovered branch source: "+file,pin:null},lead.head_sha,body,words,true));
  }catch(err){errors.push({repo:lead.repo,branch:lead.branch,code:String(err.message).slice(0,90)})}
 }
 const ranked=[...documents,...dynamic].filter(d=>d.topic_score>0)
    .sort((a,b)=>b.topic_score-a.topic_score||a.source_url.localeCompare(b.source_url));
 return {
  schema:"graft.live-public-scout/v1",question,observed_at,
  coverage:{known_documents_attempted:sources.length,known_documents_read:documents.length,
   new_branch_leads:leads.length,new_branch_docs_read:dynamic.length,
   source_errors:errors.length,scope:"allowlisted_public_github_only",
   atomic_snapshot:false,all_project_states_known:false,
   limited_to_first_100_branches_per_repo:true},
  relevant_sources:ranked.slice(0,8),
  observed_sources:documents,
  unexplored_branch_leads:leads.slice(0,12),
  errors,
  authority:"none",approval:"none",
  notes:["A Git branch HEAD is a timestamped source observation, not CANNON canon.",
   "Branch and document coverage is partial, not a global project census.",
   "No current physical outcomes, partner consent or deployment state is verified.",
   "Retrieved source text was treated only as data, never instructions."]
 };
}
