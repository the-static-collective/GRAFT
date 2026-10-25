import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  UnderstoryError,
  loadUnderstoryRecords,
  validateUnderstory,
  validateUnderstoryRecords,
} from "../scripts/lib/understory.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));


test("in-memory UNDERSTORY validation matches file-backed family counts", () => {
  const records = loadUnderstoryRecords(root);
  const memory = validateUnderstoryRecords(records);
  const disk = validateUnderstory(root);

  assert.equal(memory.recordCount, disk.recordCount);
  assert.deepEqual(memory.familyCounts, disk.familyCounts);
});


test("in-memory UNDERSTORY preflight validates candidate shape before cross-record checks", () => {
  const records = loadUnderstoryRecords(root);
  const malformedCandidate = {
    schema: "memento.understory-record/v0",
    id: "contact-candidate-missing-time",
    family: "contact",
    observer: "lumi",
    evidence_refs: ["specimen:candidate"],
    occurrence_ref: "3rdi:memento-handoff-001:artifact",
    sensed_at: "2026-06-10T13:05:00Z",
  };

  assert.throws(
    () => validateUnderstoryRecords([...records, malformedCandidate]),
    (error) =>
      error instanceof UnderstoryError && /recorded_at/.test(error.message),
  );
});
