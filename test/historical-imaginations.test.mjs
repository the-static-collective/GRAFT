import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const saver = join(root, "scripts", "save-historical-imagination.mjs");
const contextCompiler = join(root, "scripts", "compile-context-pack.mjs");

function runSaver(targetRoot, args) {
  return spawnSync(process.execPath, [saver, ...args, "--root", targetRoot], {
    cwd: root,
    encoding: "utf8",
  });
}

function runContext(targetRoot, world, depth = 1) {
  return spawnSync(
    process.execPath,
    [contextCompiler, "--world", world, "--depth", String(depth), "--root", targetRoot],
    { cwd: root, encoding: "utf8" },
  );
}

function repoCopy() {
  const copy = mkdtempSync(join(tmpdir(), "memento-historical-save-"));
  cpSync(root, copy, { recursive: true });
  return copy;
}

test("save Historical Imagination accepts a bare non-Novelist world and refuses duplicate ids", () => {
  const copy = repoCopy();
  const args = [
    "--id", "bare-world",
    "--title", "Bare World",
    "--source-cut", "specimen:bare-world",
  ];

  const first = runSaver(copy, args);
  assert.equal(first.status, 0, first.stderr);
  const receipt = JSON.parse(first.stdout);
  assert.equal(receipt.schema, "memento.world-save-receipt/v0");
  assert.equal(receipt.world_id, "bare-world");
  assert.equal(receipt.authority, "addressed-world-not-canon");
  assert.deepEqual(receipt.copied_roots, []);
  assert.equal(
    existsSync(join(copy, "historical-imaginations", "instances", "bare-world", "WORLD.md")),
    true,
  );
  const registry = JSON.parse(
    readFileSync(join(copy, "historical-imaginations", "registry.json"), "utf8"),
  );
  assert.equal(registry.worlds.filter((world) => world.id === "bare-world").length, 1);

  const second = runSaver(copy, args);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /already exists/);
});

test("save Historical Imagination copies approved Novelist roots and excludes published output", () => {
  const copy = repoCopy();
  const source = mkdtempSync(join(tmpdir(), "novelist-world-"));
  mkdirSync(join(source, "characters"), { recursive: true });
  writeFileSync(join(source, "characters", "derek.md"), "# Derek\n");
  mkdirSync(join(source, "world"), { recursive: true });
  writeFileSync(join(source, "world", "room.md"), "# Room\n");
  mkdirSync(join(source, "published"), { recursive: true });
  writeFileSync(join(source, "published", "book.epub"), "not copied");
  writeFileSync(join(source, "project.md"), "# Project\n");

  const result = runSaver(copy, [
    "--id", "novelist-shaped",
    "--title", "Novelist Shaped",
    "--source-cut", "specimen:novelist-shaped",
    "--source-dir", source,
  ]);

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.deepEqual(receipt.copied_roots, ["characters", "project.md", "world"]);
  const destination = join(
    copy,
    "historical-imaginations",
    "instances",
    "novelist-shaped",
  );
  assert.equal(readFileSync(join(destination, "characters", "derek.md"), "utf8"), "# Derek\n");
  assert.equal(readFileSync(join(destination, "world", "room.md"), "utf8"), "# Room\n");
  assert.equal(readFileSync(join(destination, "project.md"), "utf8"), "# Project\n");
  assert.equal(existsSync(join(destination, "published")), false);
});

test("context pack retrieves neighboring Historical Imaginations without adopting them", () => {
  const first = runContext(root, "same-room-a0", 1);
  assert.equal(first.status, 0, first.stderr);
  const second = runContext(root, "same-room-a0", 1);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, first.stdout, "context output must be byte-deterministic");

  const pack = JSON.parse(first.stdout);
  assert.equal(pack.schema, "memento.context-pack/v0");
  assert.equal(pack.origin_world, "same-room-a0");
  assert.equal(pack.depth, 1);
  assert.equal(pack.admission, "none");
  assert.ok(pack.worlds.some((world) => world.id === "same-room-a1"));
  assert.ok(pack.edges.some((edge) => edge.id === "hi-edge-same-room-replay-0001"));
  assert.ok(pack.worlds.every((world) => world.admission === "none"));
  assert.ok(pack.edges.every((edge) => edge.admission === "none"));
  assert.match(pack.notice, /Retrieval does not admit/);
});
