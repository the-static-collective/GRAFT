import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = {
  blackstar: process.env.GRAFT_BLACKSTAR_ROOT,
  memento: process.env.GRAFT_MEMENTO_ROOT,
  freegraph: process.env.GRAFT_FREEGRAPH_ROOT,
};
if (Object.values(roots).some(x=>!x)) throw Error("All pinned native runtime checkouts are required.");
function run(input="early-cut.json", override={}) {
  return spawnSync(process.execPath,[
    join(root,"src","free-graph.mjs"),
    "--cut",join(root,"fixtures",input),
    "--world",override.world||"same-room-a0",
    "--depth","1",
    "--blackstar-root",override.blackstar||roots.blackstar,
    "--memento-root",override.memento||roots.memento,
    "--freegraph-root",override.freegraph||roots.freegraph,
    "--graph-depth",String(override.depth??1),
    ...(override.focus ? ["--focus-world",override.focus] : []),
  ],{encoding:"utf8",timeout:45000,maxBuffer:3*1024*1024});
}
test("native Free Graph packet is content addressed and preserves a proposed MEMENTO link",()=>{
  const r=run();assert.equal(r.status,0,r.stderr);
  const value=JSON.parse(r.stdout);
  assert.equal(value.schema,"graft.free-graph-reconstruction/v1");
  assert.match(value.free_graph_packet.packet_id,/^fgp:sha256:[0-9a-f]{64}$/);
  assert.equal(value.free_graph_packet.task_world_cut.status,"unresolved");
  assert.ok(value.free_graph_packet.links.some(l=>l.status==="proposed"));
  assert.ok(value.free_graph_packet.links.every(l=>l.authority==="none"));
  assert.ok(value.free_graph_packet.links.every(l=>l.verb!=="constitutes"));
  assert.ok(value.free_graph_packet.sources.every(s=>s.access==="private"&&s.export==="pointer-only"));
  assert.ok(value.free_graph_packet.sources.every(s=>s.redaction && !s.excerpt));
  assert.equal(value.owner_gate,"NOT_INVOKED");
  assert.equal(value.effects,"none");
});
test("bounded neighborhood is an actual native Free Graph projection",()=>{
  const a=JSON.parse(run("early-cut.json",{depth:0}).stdout);
  const b=JSON.parse(run("early-cut.json",{depth:1}).stdout);
  assert.equal(a.neighborhood.nodes.length,1);
  assert.equal(a.neighborhood.links.length,0);
  assert.ok(b.neighborhood.nodes.length>a.neighborhood.nodes.length);
  assert.ok(b.neighborhood.links.length>0);
  assert.notEqual(a.neighborhood.packet_id,b.neighborhood.packet_id);
});
test("unknown world cannot be generated",()=>{
  const r=run("early-cut.json",{focus:"unknown-world"});
  assert.notEqual(r.status,0);assert.equal(r.stdout,"");
  assert.match(r.stderr,/FREE_GRAPH_NATIVE_REFUSED/);
});
test("Black Star future knowledge refusal propagates to graph",()=>{
  const r=run("future-in-early-cut.json");
  assert.notEqual(r.status,0);assert.equal(r.stdout,"");
  assert.match(r.stderr,/BLACK_STAR_VALIDATION_REFUSED/);
});
test("refusing wrong Free Graph source revision",()=>{
  const r=run("early-cut.json",{freegraph:root});
  assert.notEqual(r.status,0);assert.equal(r.stdout,"");
  assert.match(r.stderr,/FREE_GRAPH_SOURCE_REF_MISMATCH/);
});
test("deterministic packet and neighborhood without invented timestamps",()=>{
  const a=run(),b=run();
  assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);
  assert.equal(a.stdout,b.stdout);
});
test("bad depth does not yield a packet",()=>{
  const r=run("early-cut.json",{depth:5});
  assert.notEqual(r.status,0);assert.equal(r.stdout,"");
  assert.match(r.stderr,/INVALID_GRAPH_DEPTH/);
});
