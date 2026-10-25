#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  FAMILY_DIRS,
  loadUnderstoryRecords,
  validateUnderstoryRecords,
} from "./lib/understory.mjs";

const HANDOFF_SCHEMA = "3rdi.memento-handoff/v0";
const HANDOFF_AUTHORITY = "handoff-only-no-write-no-admission";
const RECEIPT_SCHEMA = "memento.3rdi-ingest-receipt/v0";
const RECEIPT_AUTHORITY = "understory-record-only-not-canon";
const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function refuse(message) {
  process.stderr.write(`REFUSED: ${message}\n`);
  process.exit(1);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStableId(value, label) {
  const result = requireString(value, label);
  if (!STABLE_ID.test(result)) throw new Error(`${label} must be a stable lowercase id`);
  return result;
}

function requireTimestamp(value, label) {
  const result = requireString(value, label);
  if (!RFC3339_UTC.test(result) || !Number.isFinite(Date.parse(result))) {
    throw new Error(`${label} must be an RFC3339 UTC timestamp ending in Z`);
  }
  return result;
}

function requireStringList(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => requireString(item, `${label}[${index}]`));
}

function parseArgs(argv) {
  if (argv.length === 1) return { inputPath: resolve(argv[0]), root: process.cwd() };
  if (argv.length === 3 && argv[1] === "--root") {
    return { inputPath: resolve(argv[0]), root: resolve(argv[2]) };
  }
  refuse("usage: node scripts/ingest-3rdi-handoff.mjs HANDOFF.json [--root PROJECT_ROOT]");
}

function foreignRef(fieldId, ref) {
  return `3rdi:${fieldId}:${requireString(ref, "foreign reference")}`;
}

function importedId(fieldId, sourceId) {
  return `3rdi-${fieldId}-${requireStableId(sourceId, "source trace id")}`;
}

function commonRecord(handoff, source, family) {
  const observer = requireString(source.observer, `${source.id}.observer`);
  if (observer !== handoff.observer) {
    throw new Error(`${source.id}.observer must match handoff observer`);
  }
  const evidenceRefs = requireStringList(source.evidence_refs ?? [], `${source.id}.evidence_refs`)
    .map((ref) => foreignRef(handoff.field_id, ref));
  const record = {
    schema: "memento.understory-record/v0",
    id: importedId(handoff.field_id, source.id),
    family,
    observer,
    recorded_at: handoff.emitted_at,
    evidence_refs: evidenceRefs,
  };
  if (handoff.world_instance_id !== undefined) {
    record.world_instance_id = handoff.world_instance_id;
  }
  return record;
}

function translateHandoff(rawHandoff) {
  const handoff = requireObject(rawHandoff, "3rdi handoff");
  if (handoff.schema !== HANDOFF_SCHEMA) {
    throw new Error(`handoff schema must equal ${HANDOFF_SCHEMA}`);
  }
  if (handoff.authority !== HANDOFF_AUTHORITY) {
    throw new Error(`handoff authority must equal ${HANDOFF_AUTHORITY}`);
  }
  handoff.field_id = requireStableId(handoff.field_id, "handoff.field_id");
  handoff.observer = requireString(handoff.observer, "handoff.observer");
  handoff.cut_id = requireStableId(handoff.cut_id, "handoff.cut_id");
  handoff.emitted_at = requireTimestamp(handoff.emitted_at, "handoff.emitted_at");
  requireString(handoff.projection_digest, "handoff.projection_digest");
  if (handoff.world_instance_id !== undefined) {
    handoff.world_instance_id = requireStableId(
      handoff.world_instance_id,
      "handoff.world_instance_id",
    );
  }
  const trace = requireObject(handoff.epistemic_trace, "handoff.epistemic_trace");
  const contacts = Array.isArray(trace.contacts) ? trace.contacts : [];
  const attention = Array.isArray(trace.attention_events) ? trace.attention_events : [];
  const decoders = Array.isArray(trace.decoder_applications) ? trace.decoder_applications : [];
  const stances = Array.isArray(trace.stances) ? trace.stances : [];

  const records = [];
  for (const raw of contacts) {
    const source = requireObject(raw, "handoff contact");
    const record = commonRecord(handoff, source, "contact");
    record.occurrence_ref = foreignRef(
      handoff.field_id,
      requireStableId(source.occurrence_id, `${source.id}.occurrence_id`),
    );
    record.sensed_at = requireTimestamp(source.sensed_at, `${source.id}.sensed_at`);
    records.push(record);
  }

  for (const raw of attention) {
    const source = requireObject(raw, "handoff attention");
    const record = commonRecord(handoff, source, "attention");
    record.contact_ref = importedId(
      handoff.field_id,
      requireStableId(source.contact_id, `${source.id}.contact_id`),
    );
    record.action = requireString(source.action, `${source.id}.action`);
    record.occurred_at = requireTimestamp(source.occurred_at, `${source.id}.occurred_at`);
    records.push(record);
  }

  for (const raw of decoders) {
    const source = requireObject(raw, "handoff decoder application");
    const record = commonRecord(handoff, source, "decoder");
    record.contact_ref = importedId(
      handoff.field_id,
      requireStableId(source.contact_id, `${source.id}.contact_id`),
    );
    record.decoder_ref = foreignRef(
      handoff.field_id,
      requireString(source.decoder_ref, `${source.id}.decoder_ref`),
    );
    record.projection_ref = foreignRef(
      handoff.field_id,
      requireString(source.projection_ref, `${source.id}.projection_ref`),
    );
    record.applied_at = requireTimestamp(source.applied_at, `${source.id}.applied_at`);
    records.push(record);
  }

  for (const raw of stances) {
    const source = requireObject(raw, "handoff stance");
    const record = commonRecord(handoff, source, "stance");
    record.projection_ref = foreignRef(
      handoff.field_id,
      requireString(source.projection_ref, `${source.id}.projection_ref`),
    );
    record.stance = requireString(source.stance, `${source.id}.stance`);
    record.formed_at = requireTimestamp(source.formed_at, `${source.id}.formed_at`);
    records.push(record);
  }

  return { handoff, records: records.sort((a, b) => a.id.localeCompare(b.id)) };
}

function destinationFor(root, record) {
  const directory = FAMILY_DIRS[record.family];
  if (!directory) throw new Error(`unsupported translated family ${record.family}`);
  return resolve(root, "understory", directory, `${record.id}.json`);
}

const { inputPath, root } = parseArgs(process.argv.slice(2));
let parsed;
try {
  parsed = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (error) {
  refuse(`cannot read 3rdi handoff: ${error.message}`);
}

let translated;
try {
  translated = translateHandoff(parsed);
} catch (error) {
  refuse(error.message);
}

const destinations = translated.records.map((record) => [record, destinationFor(root, record)]);
for (const [record, destination] of destinations) {
  if (existsSync(destination)) {
    refuse(`UNDERSTORY destination already exists for ${record.id}`);
  }
}

try {
  const existing = loadUnderstoryRecords(root);
  validateUnderstoryRecords([...existing, ...translated.records]);
} catch (error) {
  refuse(error.message);
}

const written = [];
try {
  for (const [record, destination] of destinations) {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
    written.push(destination);
  }
} catch (error) {
  for (const destination of written.reverse()) rmSync(destination, { force: true });
  refuse(`UNDERSTORY batch write failed: ${error.message}`);
}

process.stdout.write(
  `${JSON.stringify(
    {
      schema: RECEIPT_SCHEMA,
      status: "recorded",
      handoff_schema: HANDOFF_SCHEMA,
      record_ids: translated.records.map((record) => record.id).sort(),
      authority: RECEIPT_AUTHORITY,
    },
    null,
    2,
  )}\n`,
);
