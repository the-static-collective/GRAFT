"use strict";
const by=id=>document.getElementById(id);
const block=(title,detail,href)=>{
 const div=document.createElement("div");div.className="entry";
 const s=document.createElement("strong");s.textContent=title;div.append(s);
 if(detail){const d=document.createElement("small");d.textContent=detail;div.append(d)}
 if(href && /^https:\/\/github\.com\/the-static-collective\/planZ\/blob\/[a-f0-9]{40}\//.test(href)){
   const a=document.createElement("a");a.href=href;a.target="_blank";
   a.rel="noopener noreferrer";a.textContent="Inspect immutable plan source ↗";div.append(a);
 }
 return div;
};
by("packet").addEventListener("change",async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  if(f.size>1024*1024)throw Error("The local receipt exceeds 1 MB.");
  const v=JSON.parse(await f.text());
  if(v?.schema!=="graft.jarvis-graph-cannon-planz/v1"||
    v.disposition!=="HOLD_FOR_OWNER_REVIEW"||v.authority!=="none"||
    v.admission!=="none"||v.side_effects!=="none"||v.no_network!==true||
    v.attention?.external_delivery!==false||
    v.planz?.status!=="SNAPSHOT_NOT_CURRENT_OWNER_PLAN"||
    v.free_graph?.authority!=="none"||
    v.cannon?.deployment_grants!==0||
    !Array.isArray(v.planz.matched_review_candidates)||
    !Array.isArray(v.planz.pinned_proposal_matches)||
    !Array.isArray(v.cannon.selections)||
    !Array.isArray(v.free_graph.source_matches)){
   throw Error("Unsupported or authority-bearing packet.");
  }
  by("results").hidden=false;
  by("question").textContent=v.question;
  by("answer").textContent=v.attention.answer;
  by("graphSummary").textContent=v.free_graph.graph_nodes+" source nodes and "+v.free_graph.graph_links+
    " explicitly represented links. Matches remain non-authoritative.";
  const ns=by("nodes");ns.replaceChildren();
  for(const n of v.free_graph.source_matches.slice(0,20)){
   ns.append(block(n.label,n.kind+" · "+n.status+" · "+n.authority));
  }
  if(!ns.children.length)ns.append(block("No direct title match","The graph may contain other roads; no new relationship was inferred."));
  const plans=by("plans");plans.replaceChildren();
  for(const p of v.planz.matched_review_candidates.slice(0,20)){
   plans.append(block(p.title,p.phase+" / "+p.lane+" · historical snapshot "+v.planz.snapshot_as_of));
  }
  for(const p of v.planz.pinned_proposal_matches.slice(0,20)){
   plans.append(block(p.title,p.status_at_source+" · as of "+p.source_date+" · current: "+p.current_status,p.source_url));
  }
  if(!plans.children.length)plans.append(block("No directly matched historical plan","Research the current owning project before making a recommendation."));
  by("cannonStatus").textContent=v.cannon.status+" · trusted pins supplied: "+v.cannon.trusted_owner_count+
    ". A branch name or successful test does not confer canon or permission.";
  const sel=by("selections");sel.replaceChildren();
  for(const p of v.cannon.selections.slice(0,20))sel.append(block(p.scope+" / "+p.track,p.repository+" @ "+p.commit+" · selection only"));
  if(!sel.children.length)sel.append(block("No trusted selection shown","UNKNOWN is not the same as no canon existing."));
  by("next").textContent=v.proposed_next.summary;
  by("msg").textContent="Local source-attendant receipt opened. This static reader does not independently verify pinned Git commits or signatures.";
 }catch(err){by("results").hidden=true;by("msg").textContent="REFUSED: "+(err.message||"Invalid JSON");}
});
