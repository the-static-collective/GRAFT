import test from "node:test";
import assert from "node:assert/strict";
import {makeLocalServer} from "../src/serve-live.mjs";

function fixture(question){
 return {
  schema:"graft.jarvis-live-work/v1",authority:"none",
  approval:"HUMAN_REQUIRED_FOR_EXTERNAL_EFFECTS",
  remote_writes:0,canon_changes:0,people_contacted:0,
  work_plan:{
   schema:"graft.useful-work-plan/v1",question,focus:"food",
   title:"A question kit",observed_at:"2026-10-25T12:00:00Z",
   original_source_refs:[],next_24h:"Print and ask a willing steward."
  }
 };
}
async function withServer(fn){
 const instance=await makeLocalServer({port:0,runner:async q=>fixture(q)});
 try{return await fn(instance)}finally{await instance.close()}
}
test("local desk binds loopback, no storage or side-effect authority",async()=>{
 await withServer(async instance=>{
  const base="http://127.0.0.1:"+instance.port;
  assert.equal(instance.server.address().address,"127.0.0.1");
  const s=await fetch(base+"/health");
  assert.equal(s.status,200);
  const data=await s.json();
  assert.equal(data.real_world_effects,false);
  const view=await fetch(base+"/");
  assert.equal(view.status,200);
  assert.match(await view.text(),/JAR;VIS/);
  assert.equal(view.headers.get("cache-control"),"no-store");
 });
});
test("no cross-origin research post even on localhost",async()=>{
 await withServer(async instance=>{
  const base="http://127.0.0.1:"+instance.port;
  const r=await fetch(base+"/api/ask",{method:"POST",headers:{
    "Content-Type":"application/json","Origin":"https://untrusted.example"},
    body:JSON.stringify({question:"grocery"})});
  assert.equal(r.status,403);
  assert.equal((await r.json()).error,"LOCAL_ORIGIN_REQUIRED");
 });
});
test("one explicitly requested printable artifact from an ephemeral local receipt",async()=>{
 await withServer(async instance=>{
  const base="http://127.0.0.1:"+instance.port;
  const headers={"Content-Type":"application/json","Origin":base};
  const request=await fetch(base+"/api/ask",{method:"POST",headers,
    body:JSON.stringify({question:"Waseca grocery"})});
  assert.equal(request.status,200);
  const packet=await request.json();
  assert.equal(packet.result.authority,"none");
  assert.equal(packet.publication,false);
  assert.match(packet.id,/^[a-f0-9]{64}$/);
  const download=await fetch(base+"/api/kit",{method:"POST",headers,
    body:JSON.stringify({id:packet.id})});
  assert.equal(download.status,200);
  assert.match(download.headers.get("content-disposition"),/attachment/);
  const html=await download.text();
  assert.match(html,/NEED/);assert.match(html,/OFFER/);assert.match(html,/RETURN/);
  const duplicate=await fetch(base+"/api/kit",{method:"POST",headers,
    body:JSON.stringify({id:packet.id})});
  assert.equal(duplicate.status,404);
 });
});
test("invalid questions and routes refuse rather than fabricate answers",async()=>{
 await withServer(async instance=>{
  const base="http://127.0.0.1:"+instance.port;
  const headers={"Content-Type":"application/json","Origin":base};
  const invalid=await fetch(base+"/api/ask",{method:"POST",headers,
    body:JSON.stringify({question:""})});
  assert.equal(invalid.status,400);
  const unsafe=await fetch(base+"/internal",{method:"GET"});
  assert.equal(unsafe.status,404);
 });
});
