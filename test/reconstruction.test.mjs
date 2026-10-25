import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blackstarRoot = process.env.GRAFT_BLACKSTAR_ROOT;
const mementoRoot = process.env.GRAFT_MEMENTO_ROOT;
if (!blackstarRoot || !mementoRoot) throw Error(
  "Native integration tests require GRAFT_BLACKSTAR_ROOT and GRAFT_MEMENTO_ROOT pinned donor checkouts."
);
function call(name, options = []) {
  return spawnSync(process.execPath, [
    join(root, "src", "reconstruct.mjs"),
    "--cut", join(root, "fixtures", name),
    "--world", "same-room-a0",
    "--blackstar-root", blackstarRoot,
    "--memento-root", mementoRoot,
    ...options,
  ], {encoding:"utf8", timeout:40000});
}
test("native Black Star -> native MEMENTO -> GRAFT proposal, with no admission", () => {
  const r = call("early-cut.json");
  assert.equal(r.status, 0, r.stderr);
  const receipt = JSON.parse(r.stdout);
  assert.equal(receipt.schema, "graft.reconstruction-receipt/v1");
  assert.equal(receipt.blackstar.native_validation, "PASS");
  assert.equal(receipt.blackstar.carrier_count, 1);
  assert.equal(receipt.memento.native_context, "COMPILED");
  assert.equal(receipt.memento.origin_world, "same-room-a0");
  assert.ok(receipt.memento.world_ids.includes("same-room-a1"));
  assert.ok(receipt.memento.relations.some(e => e.status === "proposed"));
  assert.ok(receipt.memento.relations.every(e => e.admission === "none"));
  assert.equal(receipt.disposition, "PROPOSE_ONLY");
  assert.equal(receipt.proposal.gate, "NOT_INVOKED");
  assert.equal(receipt.proposal.local_write, "NOT_PERFORMED");
  assert.equal(receipt.authority, "none");
  assert.equal(receipt.side_effects, "none");
});
test("future discovery cannot pass an earlier Black Star cut", () => {
  const r = call("future-in-early-cut.json");
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /BLACK_STAR_VALIDATION_REFUSED/);
});
test("unknown historical world refuses instead of fabricating context", () => {
  const r = call("early-cut.json", ["--world", "unknown-imaginary-world"]);
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /MEMENTO_CONTEXT_REFUSED/);
});
test("cannot claim the adapter checkout is a native source", () => {
  const r = call("early-cut.json", ["--blackstar-root", root]);
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /BLACK_STAR_SOURCE_REF_MISMATCH/);
});
test("output deterministic without clock-based authority", () => {
  const a = call("early-cut.json");
  const b = call("early-cut.json");
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.equal(a.stdout, b.stdout);
});
