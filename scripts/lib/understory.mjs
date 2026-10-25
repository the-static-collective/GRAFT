import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";

export const UNDERSTORY_SCHEMA = "memento.understory-record/v0";
export const FAMILY_DIRS = Object.freeze({
  contact: "contacts",
  attention: "attention",
  decoder: "decoders",
  stance: "stances",
  association: "associations",
  activation: "activations",
});
export const ATTENTION_ACTIONS = new Set(["attended", "ignored", "abandoned"]);
export const STANCES = new Set(["accepted", "held", "rejected"]);

const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export class UnderstoryError extends Error {}

function refuse(message) {
  throw new UnderstoryError(message);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    refuse(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStableId(value, label) {
  const id = requireString(value, label);
  if (!STABLE_ID.test(id)) refuse(`${label} must be a stable lowercase id`);
  return id;
}

function requireStringList(value, label, { min = 0 } = {}) {
  if (!Array.isArray(value) || value.length < min) {
    refuse(`${label} must be an array with at least ${min} item(s)`);
  }
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
  return value;
}

function instant(value, label) {
  if (typeof value !== "string" || !RFC3339_UTC.test(value)) {
    refuse(`${label} must be an RFC3339 UTC timestamp ending in Z`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) refuse(`${label} must be a valid timestamp`);
  return parsed;
}

function eventInstant(record) {
  if (record.family === "contact") return instant(record.sensed_at, `${record.id}.sensed_at`);
  if (record.family === "attention") return instant(record.occurred_at, `${record.id}.occurred_at`);
  if (record.family === "decoder") return instant(record.applied_at, `${record.id}.applied_at`);
  if (record.family === "stance") return instant(record.formed_at, `${record.id}.formed_at`);
  if (record.family === "activation") return instant(record.activated_at, `${record.id}.activated_at`);
  return instant(record.recorded_at, `${record.id}.recorded_at`);
}

function validateCommon(record, expectedFamily, sourceLabel) {
  requireObject(record, sourceLabel);
  if (record.schema !== UNDERSTORY_SCHEMA) {
    refuse(`${sourceLabel} schema must equal ${UNDERSTORY_SCHEMA}`);
  }
  requireStableId(record.id, `${sourceLabel}.id`);
  if (record.family !== expectedFamily) {
    refuse(`${sourceLabel} family must equal ${expectedFamily}`);
  }
  requireString(record.observer, `${sourceLabel}.observer`);
  instant(record.recorded_at, `${sourceLabel}.recorded_at`);
  requireStringList(record.evidence_refs, `${sourceLabel}.evidence_refs`);
  if (record.world_instance_id !== undefined) {
    requireStableId(record.world_instance_id, `${sourceLabel}.world_instance_id`);
  }
}

function validateShape(record, sourceLabel) {
  if (record.family === "contact") {
    requireString(record.occurrence_ref, `${sourceLabel}.occurrence_ref`);
    instant(record.sensed_at, `${sourceLabel}.sensed_at`);
    return;
  }

  if (record.family === "attention") {
    requireString(record.contact_ref, `${sourceLabel}.contact_ref`);
    if (!ATTENTION_ACTIONS.has(record.action)) {
      refuse(`UNDERSTORY attention ${record.id} action must be attended, ignored, or abandoned`);
    }
    instant(record.occurred_at, `${sourceLabel}.occurred_at`);
    return;
  }

  if (record.family === "decoder") {
    requireString(record.contact_ref, `${sourceLabel}.contact_ref`);
    requireString(record.decoder_ref, `${sourceLabel}.decoder_ref`);
    requireString(record.projection_ref, `${sourceLabel}.projection_ref`);
    instant(record.applied_at, `${sourceLabel}.applied_at`);
    return;
  }

  if (record.family === "stance") {
    requireString(record.projection_ref, `${sourceLabel}.projection_ref`);
    if (!STANCES.has(record.stance)) {
      refuse(`UNDERSTORY stance ${record.id} stance must be accepted, held, or rejected`);
    }
    instant(record.formed_at, `${sourceLabel}.formed_at`);
    return;
  }

  if (record.family === "association") {
    requireStringList(record.member_refs, `${sourceLabel}.member_refs`, { min: 2 });
    requireString(record.relation_hint, `${sourceLabel}.relation_hint`);
    if (record.status !== "unresolved") {
      refuse(`UNDERSTORY association ${record.id} status must remain unresolved`);
    }
    return;
  }

  if (record.family === "activation") {
    requireStringList(record.trace_refs, `${sourceLabel}.trace_refs`, { min: 1 });
    requireString(record.trigger_ref, `${sourceLabel}.trigger_ref`);
    requireString(record.descendant_projection_ref, `${sourceLabel}.descendant_projection_ref`);
    instant(record.activated_at, `${sourceLabel}.activated_at`);
  }
}

export function loadUnderstoryRecords(root) {
  const records = [];
  for (const [family, directory] of Object.entries(FAMILY_DIRS)) {
    const familyRoot = resolve(root, "understory", directory);
    if (!existsSync(familyRoot)) continue;
    for (const name of readdirSync(familyRoot).sort()) {
      const path = resolve(familyRoot, name);
      if (!statSync(path).isFile() || !name.endsWith(".json")) continue;
      let record;
      try {
        record = JSON.parse(readFileSync(path, "utf8"));
      } catch (error) {
        refuse(`invalid UNDERSTORY JSON at understory/${directory}/${name}: ${error.message}`);
      }
      validateCommon(record, family, `understory/${directory}/${name}`);
      validateShape(record, `understory/${directory}/${name}`);
      records.push(record);
    }
  }
  return records;
}

export function validateUnderstoryRecords(records) {
  if (!Array.isArray(records)) refuse("UNDERSTORY records must be an array");

  const byId = new Map();
  const familyCounts = Object.fromEntries(
    Object.keys(FAMILY_DIRS).map((family) => [family, 0]),
  );

  records.forEach((record, index) => {
    const sourceLabel = `UNDERSTORY candidate[${index}]`;
    requireObject(record, sourceLabel);
    const family = requireString(record.family, `${sourceLabel}.family`);
    if (!(family in FAMILY_DIRS)) {
      refuse(`${sourceLabel}.family must name a supported UNDERSTORY family`);
    }
    validateCommon(record, family, sourceLabel);
    validateShape(record, sourceLabel);
    if (byId.has(record.id)) refuse(`duplicate UNDERSTORY id ${record.id}`);
    byId.set(record.id, record);
    familyCounts[family] += 1;
  });

  for (const record of records) {
    if (record.family === "attention") {
      const contact = byId.get(record.contact_ref);
      if (!contact || contact.family !== "contact") {
        refuse(`UNDERSTORY attention ${record.id} references unknown contact ${record.contact_ref}`);
      }
      if (contact.observer !== record.observer) {
        refuse(`UNDERSTORY attention ${record.id} observer must match contact observer`);
      }
      if (eventInstant(record) < eventInstant(contact)) {
        refuse(`UNDERSTORY attention ${record.id} cannot precede contact`);
      }
    }

    if (record.family === "decoder") {
      const contact = byId.get(record.contact_ref);
      if (!contact || contact.family !== "contact") {
        refuse(`UNDERSTORY decoder ${record.id} references unknown contact ${record.contact_ref}`);
      }
      if (contact.observer !== record.observer) {
        refuse(`UNDERSTORY decoder ${record.id} observer must match contact observer`);
      }
      if (eventInstant(record) < eventInstant(contact)) {
        refuse(`UNDERSTORY decoder ${record.id} cannot precede contact`);
      }
    }

    if (record.family === "stance") {
      const decoder = records.find(
        (candidate) =>
          candidate.family === "decoder" &&
          candidate.projection_ref === record.projection_ref,
      );
      if (!decoder) {
        refuse(`UNDERSTORY stance ${record.id} references unknown projection ${record.projection_ref}`);
      }
      if (decoder.observer !== record.observer) {
        refuse(`UNDERSTORY stance ${record.id} observer must match projection observer`);
      }
      if (eventInstant(record) < eventInstant(decoder)) {
        refuse(`UNDERSTORY stance ${record.id} cannot precede decoding`);
      }
    }

    if (record.family === "activation") {
      for (const traceRef of record.trace_refs) {
        const trace = byId.get(traceRef);
        if (!trace) {
          refuse(`UNDERSTORY activation ${record.id} references unknown trace ${traceRef}`);
        }
        if (trace.observer !== record.observer) {
          refuse(`UNDERSTORY activation ${record.id} observer must match trace observer`);
        }
        if (eventInstant(record) < eventInstant(trace)) {
          refuse(`UNDERSTORY activation ${record.id} cannot precede trace ${traceRef}`);
        }
      }
    }
  }

  return {
    records: [...records],
    byId,
    recordCount: records.length,
    familyCounts,
  };
}

export function validateUnderstory(root) {
  const validated = validateUnderstoryRecords(loadUnderstoryRecords(root));
  return {
    recordCount: validated.recordCount,
    familyCounts: validated.familyCounts,
  };
}
