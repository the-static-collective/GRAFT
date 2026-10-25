import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const script = join(root, "scripts", "ingest-3rdi-handoff.mjs");
const fixture = join(root, "test", "fixtures", "3rdi-memento-handoff-001.json");
const familyDirs = ["contacts", "attention", "decoders", "stances", "associations", "activations"];

function ingest(targetRoot, inputPath = fixture) {
  return spawnSync(process.execPath, [script, inputPath, "--root", targetRoot], {
    cwd: root,
    encoding: "utf8",
  });
}

function snapshotUnderstory(targetRoot) {
  const snapshot = {};
  for (const directory of familyDirs) {
    const dir = join(targetRoot, "understory", directory);
    const entries = readdirSync(dir).sort();
    snapshot[directory] = entries.map((name) => {
      const path = join(dir, name);
      return statSync(path).isFile()
        ? [name, readFileSync(path, "utf8")]
        : [name, "<dir>"];
    });
  }
  return snapshot;
}

function mutatedFixture(transform) {
  const temp = mkdtempSync(join(tmpdir(), "memento-3rdi-input-"));
  const path = join(temp, "handoff.json");
  const value = JSON.parse(readFileSync(fixture, "utf8"));
  transform(value);
  writeFileSync(path, `${JSON.stringify(value)}\n`);
  return path;
}

test("3rdi handoff ingestion records a fully preflighted four-record batch", () => {
  const copy = mkdtempSync(join(tmpdir(), "memento-3rdi-ingest-"));
  cpSync(root, copy, { recursive: true });

  const result = ingest(copy);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.schema, "memento.3rdi-ingest-receipt/v0");
  assert.equal(receipt.status, "recorded");
  assert.equal(receipt.handoff_schema, "3rdi.memento-handoff/v0");
  assert.equal(receipt.authority, "understory-record-only-not-canon");
  assert.deepEqual(receipt.record_ids, [
    "3rdi-memento-handoff-001-attention-artifact-lumi",
    "3rdi-memento-handoff-001-contact-artifact-lumi",
    "3rdi-memento-handoff-001-decode-artifact-lumi",
    "3rdi-memento-handoff-001-stance-artifact-lumi",
  ]);

  assert.equal(
    JSON.parse(
      readFileSync(
        join(copy, "understory", "attention", "3rdi-memento-handoff-001-attention-artifact-lumi.json"),
        "utf8",
      ),
    ).contact_ref,
    "3rdi-memento-handoff-001-contact-artifact-lumi",
  );
  assert.equal(
    JSON.parse(
      readFileSync(
        join(copy, "understory", "stances", "3rdi-memento-handoff-001-stance-artifact-lumi.json"),
        "utf8",
      ),
    ).projection_ref,
    "3rdi:memento-handoff-001:projection:artifact-v1",
  );
});

test("malformed 3rdi attention ancestry refuses with zero partial writes", () => {
  const copy = mkdtempSync(join(tmpdir(), "memento-3rdi-atomic-"));
  cpSync(root, copy, { recursive: true });
  const before = snapshotUnderstory(copy);
  const input = mutatedFixture((handoff) => {
    handoff.epistemic_trace.attention_events[0].contact_id = "contact-missing-9999";
  });

  const result = ingest(copy, input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown contact|contact.*missing/i);
  assert.deepEqual(snapshotUnderstory(copy), before);
});

test("3rdi handoff destination collision refuses with zero partial writes", () => {
  const copy = mkdtempSync(join(tmpdir(), "memento-3rdi-collision-"));
  cpSync(root, copy, { recursive: true });
  const colliding = join(
    copy,
    "understory",
    "contacts",
    "3rdi-memento-handoff-001-contact-artifact-lumi.json",
  );
  writeFileSync(colliding, "sentinel\n");
  const before = snapshotUnderstory(copy);

  const result = ingest(copy);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists|collision/i);
  assert.deepEqual(snapshotUnderstory(copy), before);
});

test("copied receipt body cannot impersonate missing contact ancestry", () => {
  const copy = mkdtempSync(join(tmpdir(), "memento-3rdi-copy-body-"));
  cpSync(root, copy, { recursive: true });
  const before = snapshotUnderstory(copy);
  const input = mutatedFixture((handoff) => {
    const contact = handoff.epistemic_trace.contacts[0];
    handoff.epistemic_trace.attention_events[0].contact_id = "contact-missing-9999";
    handoff.epistemic_trace.attention_events[0].claimed_contact = contact;
  });

  const result = ingest(copy, input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown contact|contact.*missing/i);
  assert.deepEqual(snapshotUnderstory(copy), before);
});
