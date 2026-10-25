import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { relative, resolve } from "node:path";

export const REGISTRY_SCHEMA = "memento.historical-imaginations-registry/v0";
export const EDGE_SCHEMA = "memento.historical-imagination-edge/v0";
export const EDGE_STATUSES = new Set(["proposed", "admitted", "fog", "refused"]);

const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export class HistoricalImaginationsError extends Error {}

function refuse(message) {
  throw new HistoricalImaginationsError(message);
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

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    refuse(`invalid ${label} JSON at ${path}: ${error.message}`);
  }
}

function repositoryRelative(root, path, label) {
  const value = requireString(path, label);
  if (value.startsWith("/") || value.includes("\\") || /(^|\/)\.\.(\/|$)/.test(value)) {
    refuse(`${label} must be repository-relative`);
  }
  const absolute = resolve(root, value);
  const rel = relative(root, absolute).replaceAll("\\", "/");
  if (rel.startsWith("../") || rel === "..") refuse(`${label} escapes repository root`);
  return { value, absolute };
}

function readWorldId(path) {
  const body = readFileSync(path, "utf8");
  const match = body.match(/^world_id:\s*([^\s]+)\s*$/m);
  if (!match) refuse(`Historical Imagination WORLD.md is missing world_id: ${path}`);
  return match[1];
}

function admittedDecisionExists(root, decisionId) {
  const directory = resolve(root, "crossings", "admitted");
  if (!existsSync(directory)) return false;
  for (const name of readdirSync(directory).sort()) {
    const path = resolve(directory, name);
    if (!statSync(path).isFile() || !name.endsWith(".md")) continue;
    const body = readFileSync(path, "utf8");
    const id = body.match(/^id:\s*(.+)\s*$/m)?.[1];
    const outcome = body.match(/^outcome:\s*(.+)\s*$/m)?.[1];
    if (id === decisionId && outcome === "admit") return true;
  }
  return false;
}

export function loadHistoricalGraph(root) {
  const registryPath = resolve(root, "historical-imaginations", "registry.json");
  if (!existsSync(registryPath)) {
    refuse("Historical Imaginations registry is missing");
  }
  const registry = requireObject(
    readJson(registryPath, "Historical Imaginations registry"),
    "Historical Imaginations registry",
  );
  if (registry.schema !== REGISTRY_SCHEMA) {
    refuse(`Historical Imaginations registry schema must equal ${REGISTRY_SCHEMA}`);
  }
  if (!Array.isArray(registry.worlds)) {
    refuse("Historical Imaginations registry.worlds must be an array");
  }

  const worldsById = new Map();
  for (const [index, worldValue] of registry.worlds.entries()) {
    const world = requireObject(worldValue, `registry.worlds[${index}]`);
    const id = requireStableId(world.id, `registry.worlds[${index}].id`);
    if (worldsById.has(id)) refuse(`duplicate Historical Imagination world id ${id}`);
    requireString(world.title, `registry.worlds[${index}].title`);
    requireString(world.status, `registry.worlds[${index}].status`);
    requireString(world.source_cut, `registry.worlds[${index}].source_cut`);
    const created = instant(world.created_at, `registry.worlds[${index}].created_at`);
    const updated = instant(world.updated_at, `registry.worlds[${index}].updated_at`);
    if (updated < created) refuse(`Historical Imagination world ${id} updated_at cannot precede created_at`);

    const expectedPrefix = `historical-imaginations/instances/${id}/`;
    const { value: worldRef, absolute } = repositoryRelative(
      root,
      world.world_ref,
      `Historical Imagination world ${id}.world_ref`,
    );
    if (!worldRef.startsWith(expectedPrefix)) {
      refuse(`Historical Imagination world ${id}.world_ref must stay inside ${expectedPrefix}`);
    }
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      refuse(`Historical Imagination world ${id}.world_ref does not exist`);
    }
    if (readWorldId(absolute) !== id) {
      refuse(`Historical Imagination world ${id} WORLD.md world_id does not match registry`);
    }
    worldsById.set(id, { ...world });
  }

  const edges = [];
  const edgeIds = new Set();
  const edgeRoot = resolve(root, "historical-imaginations", "edges");
  if (existsSync(edgeRoot)) {
    for (const name of readdirSync(edgeRoot).sort()) {
      const path = resolve(edgeRoot, name);
      if (!statSync(path).isFile() || !name.endsWith(".json")) continue;
      const edge = requireObject(
        readJson(path, "Historical Imagination edge"),
        `Historical Imagination edge ${name}`,
      );
      if (edge.schema !== EDGE_SCHEMA) {
        refuse(`Historical Imagination edge ${name} schema must equal ${EDGE_SCHEMA}`);
      }
      const id = requireStableId(edge.id, `Historical Imagination edge ${name}.id`);
      if (edgeIds.has(id)) refuse(`duplicate Historical Imagination edge id ${id}`);
      edgeIds.add(id);
      const from = requireStableId(edge.from, `Historical Imagination edge ${id}.from`);
      const to = requireStableId(edge.to, `Historical Imagination edge ${id}.to`);
      if (!worldsById.has(from) || !worldsById.has(to)) {
        refuse(`Historical Imagination edge ${id} references unknown world`);
      }
      requireString(edge.relation, `Historical Imagination edge ${id}.relation`);
      instant(edge.born_at, `Historical Imagination edge ${id}.born_at`);
      requireStringList(edge.basis, `Historical Imagination edge ${id}.basis`, { min: 1 });
      if (!EDGE_STATUSES.has(edge.status)) {
        refuse(`Historical Imagination edge ${id} has unsupported status ${JSON.stringify(edge.status)}`);
      }
      requireStringList(edge.observer_scope ?? [], `Historical Imagination edge ${id}.observer_scope`);
      if (edge.decision_ref !== null && edge.decision_ref !== undefined) {
        requireString(edge.decision_ref, `Historical Imagination edge ${id}.decision_ref`);
      }
      if (edge.status === "admitted") {
        if (typeof edge.decision_ref !== "string" || edge.decision_ref.length === 0) {
          refuse(`admitted edge ${id} requires decision_ref`);
        }
        if (!admittedDecisionExists(root, edge.decision_ref)) {
          refuse(`admitted edge ${id} decision_ref does not resolve to an admitted MEMENTO decision`);
        }
      }
      edges.push({ ...edge });
    }
  }

  const worlds = [...worldsById.values()].sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => a.id.localeCompare(b.id));
  return { registry: { ...registry, worlds }, worldsById, edges };
}

export function validateHistoricalImaginations(root) {
  const graph = loadHistoricalGraph(root);
  return {
    worldCount: graph.worldsById.size,
    edgeCount: graph.edges.length,
  };
}
