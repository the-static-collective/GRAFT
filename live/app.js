"use strict";
const by=id=>document.getElementById(id);
let receiptId=null;
const entry=(el,title,detail,url)=>{
 const wrap=document.createElement("div");wrap.className="entry";
 const b=document.createElement("b");b.textContent=title;wrap.append(b);
 if(detail){const small=document.createElement("small");small.textContent=detail;wrap.append(small)}
 if(typeof url==="string"&&/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9_.-]+\/blob\/[a-f0-9]{40}\//.test(url)){
  const link=document.createElement("a");link.href=url;link.rel="noopener noreferrer";link.target="_blank";
  link.textContent="Inspect this source ↗";wrap.append(link);
 }
 el.append(wrap);
};
const say=s=>by("status").textContent=s;
by("ask").addEventListener("submit",async e=>{
 e.preventDefault();const q=by("question").value.trim();
 if(!q||q.length>500)return;
 by("submit").disabled=true;by("kit").disabled=true;receiptId=null;
 by("results").hidden=true;say("Reading original source heads, examining evidence, and preparing a bounded option…");
 try{
  const r=await fetch("/api/ask",{method:"POST",
   headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q}),cache:"no-store"});
  const packet=await r.json();
  if(!r.ok)throw Error(packet.error||"Source access unavailable");
  const v=packet.result;
  if(v.schema!=="graft.jarvis-live-work/v1"||v.authority!=="none"||v.canon_changes!==0)throw Error("Unexpected authority status");
  receiptId=packet.id;
  by("headline").textContent=v.work_plan.title;
  by("action").textContent=v.work_plan.next_24h;
  by("limit").textContent="No actual volunteers, organizations or facilities have approved participation. A printable draft is not a completed plan.";
  const sc=v.fresh_public_evidence,ct=sc.coverage;
  by("coverage").textContent=ct.known_documents_read+" of "+ct.known_documents_attempted+
   " watched documents read, "+ct.new_branch_leads+" additional branch leads, observed "+sc.observed_at+
   ". This is not an exhaustive census.";
  const sources=by("sources");sources.replaceChildren();
  for(const s of sc.relevant_sources.slice(0,7)){
   entry(sources,s.title,s.repo+" / "+s.branch+" @ "+s.head_sha.slice(0,12)+
    " · status: "+s.source_state_at_observation,s.source_url);
  }
  if(!sources.children.length)entry(sources,"No directly relevant public source","Do not interpret this as absence of plans.");
  by("cannon").textContent="CANNON owner selection: "+v.historical_context.cannon_selection_state+
   ". Default branch and Git tests cannot appoint canon.";
  const leads=by("leads");leads.replaceChildren();
  for(const lead of sc.unexplored_branch_leads.slice(0,8))
   entry(leads,lead.repo+" / "+lead.branch,"Uninspected; source HEAD "+lead.head_sha.slice(0,12));
  for(const er of sc.errors.slice(0,4))
   entry(leads,"Incomplete research: "+er.repo,er.branch+" · "+er.code);
  if(!leads.children.length)entry(leads,"Other possible work remains unknown","No owner-current exhaustive project census was performed.");
  by("results").hidden=false;by("kit").disabled=false;
  say("Prepared a source-dated local proposal. Only the operator can request a printable artifact.");
 }catch(err){say("REFUSED: "+err.message)}
 finally{by("submit").disabled=false}
});
by("kit").addEventListener("click",async()=>{
 if(!receiptId)return;
 by("kit").disabled=true;say("Creating the printable packet for your own review…");
 try{
  const r=await fetch("/api/kit",{method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({id:receiptId}),cache:"no-store"});
  if(!r.ok){const error=await r.json();throw Error(error.error||"Packet unavailable")}
  const html=await r.text();
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob([html],{type:"text/html"}));
  a.href=url;a.download="jarvis-community-question-kit.html";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);receiptId=null;
  say("Printable HTML built locally for review. No outside message or field work was performed.");
 }catch(e){say("REFUSED: "+e.message);by("kit").disabled=false}
});
