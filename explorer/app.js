// Offline read-only packet explorer; no fetch, eval, network access, localStorage or writes.
"use strict";
const NS="http://www.w3.org/2000/svg";
const byId=id=>document.getElementById(id);
let raw=null, view="bounded", selected=null;
const status=(t)=>byId("status").textContent=t;
function isPacket(p) {
  return p && p.schema==="free-graph.packet/v0"
    && typeof p.packet_id==="string" && /^fgp:sha256:[0-9a-f]{64}$/.test(p.packet_id)
    && Array.isArray(p.nodes) && Array.isArray(p.links)
    && Array.isArray(p.sources) && p.nodes.length<=500 && p.links.length<=1500;
}
function graph(){return view==="bounded"?raw.neighborhood:raw.free_graph_packet;}
function el(tag,attrs={},value) {
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));
  if(value!==undefined)n.textContent=String(value);
  return n;
}
function clip(s,max=28){return s.length>max?s.slice(0,max-1)+"…":s;}
function setSelected(id) {selected=id; render();}
function render() {
  if(!raw)return;
  const p=graph();
  const list=byId("nodes");
  const query=byId("search").value.trim().toLowerCase();
  list.replaceChildren();
  p.nodes.forEach(node=>{
    if(query && ![node.label,node.kind,node.status].some(x=>x?.toLowerCase().includes(query)))return;
    const b=document.createElement("button");
    b.type="button";b.className="nodebtn"+(selected===node.id?" selected":"");
    b.setAttribute("role","listitem");
    const title=document.createElement("span");
    title.textContent=node.label;
    const sm=document.createElement("small");
    sm.textContent=node.kind.toUpperCase()+" · "+node.status.toUpperCase();
    b.append(title,sm);b.onclick=()=>setSelected(node.id);list.append(b);
  });
  byId("totals").textContent=p.nodes.length+" nodes · "+p.links.length+" explicit edges";
  byId("mapCount").textContent=p.nodes.length>60?"First 60 nodes shown":"";
  const svg=byId("map");svg.replaceChildren();
  const drawNodes=p.nodes.slice(0,60),positions=new Map();
  const cx=460,cy=317;
  drawNodes.forEach((node,i)=>{
    const angle=(i/drawNodes.length)*Math.PI*2-Math.PI/2;
    const radius=drawNodes.length===1?0:Math.min(270,110+drawNodes.length*8);
    positions.set(node.id,{x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)});
  });
  for(const link of p.links){
    const from=positions.get(link.from),to=positions.get(link.to);
    if(!from||!to)continue;
    const line=el("line",{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
      class:"edge "+link.status});
    const title=el("title",{},link.verb+" · "+link.status+" · authority: "+link.authority);
    line.appendChild(title);svg.appendChild(line);
  }
  for(const node of drawNodes){
    const p=positions.get(node.id),g=el("g");
    const circle=el("circle",{cx:p.x,cy:p.y,r:selected===node.id?21:15,
      class:"vertex"+(selected===node.id?" selected":""),
      "data-status":node.status,tabindex:0,role:"button",
      "aria-label":node.label+" ("+node.status+")"});
    circle.onclick=()=>setSelected(node.id);
    circle.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(node.id)}};
    g.append(circle,el("text",{x:p.x,y:p.y+35,"text-anchor":"middle"},clip(node.label,22)));
    svg.appendChild(g);
  }
  const node=p.nodes.find(n=>n.id===selected);
  byId("detailTitle").textContent=node?.label||"Select a visible node";
  byId("detailDescription").textContent=node
    ?node.kind+" · "+node.status+" · source references: "+node.source_ids.length
    :"Choose an item from the list or graph.";
  const container=byId("detailLinks");container.replaceChildren();
  if(node){
    const links=p.links.filter(l=>l.from===node.id||l.to===node.id);
    for(const link of links){
      const other=p.nodes.find(n=>n.id===(link.from===node.id?link.to:link.from));
      const div=document.createElement("div");div.className="linkrow";
      const txt=document.createElement("div");
      txt.textContent=(other?.label||"unknown")+" · "+link.verb;
      const sm=document.createElement("small");
      sm.textContent=link.status+" · authority "+link.authority+" · "+link.qualifier;
      div.append(txt,sm);container.append(div);
    }
    if(!links.length){const p=document.createElement("p");p.textContent="No explicit neighboring relations in this view.";container.append(p)}
  }
}
byId("packetInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  if(file.size>3*1024*1024){status("Refused: graph JSON exceeds the 3 MB local reader limit.");return}
  try{
    const parsed=JSON.parse(await file.text());
    if(parsed?.schema!=="graft.free-graph-reconstruction/v1"
      ||parsed.authority!=="none"||parsed.effects!=="none"
      ||parsed.owner_gate!=="NOT_INVOKED"
      ||!isPacket(parsed.free_graph_packet)||!isPacket(parsed.neighborhood)){
      throw Error("Not a supported read-only GRAFT graph receipt.");
    }
    if(parsed.free_graph_packet.links.some(l=>l.authority==="owner-local"||l.verb==="constitutes")){
      throw Error("Owner-local authority cannot be displayed as an unadmitted reconstruction.");
    }
    raw=parsed;view="bounded";selected=parsed.neighborhood.nodes[0]?.id||null;
    byId("workspace").hidden=false;
    for(const b of document.querySelectorAll("[data-view]"))b.classList.toggle("active",b.dataset.view===view);
    byId("state").textContent="SOURCE-LOCAL RECONSTRUCTION · NO ADMISSION";
    status("Local packet loaded. Content hashes were supplied by the native Free Graph runtime; this offline viewer does not independently verify signatures.");
    render();
  }catch(err){raw=null;byId("workspace").hidden=true;status("REFUSED: "+(err.message||"invalid JSON"))}
});
byId("search").addEventListener("input",render);
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{
  view=b.dataset.view;
  for(const n of document.querySelectorAll("[data-view]"))n.classList.toggle("active",n===b);
  selected=graph().nodes.find(n=>n.id===selected)?.id||graph().nodes[0]?.id||null;
  render();
}));
