#!/usr/bin/env node

import { resolve } from "node:path";
import { loadHistoricalGraph } from "./lib/historical-imaginations.mjs";

function refuse(message) {
  process.stderr.write(`REFUSED: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = { root: process.cwd(), depth: 1 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--world") result.world = value;
    else if (arg === "--depth") result.depth = Number(value);
    else if (arg === "--root") result.root = resolve(value);
    else refuse(`unknown argument ${arg}`);
    index += 1;
  }
  if (!result.world) {
    refuse("usage: node scripts/compile-context-pack.mjs --world WORLD_ID [--depth 0..3] [--root PROJECT_ROOT]");
  }
  if (!Number.isInteger(result.depth) || result.depth < 0 || result.depth > 3) {
    refuse("depth must be an integer from 0 through 3");
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
let graph;
try {
  graph = loadHistoricalGraph(args.root);
} catch (error) {
  refuse(error.message);
}
if (!graph.worldsById.has(args.world)) {
  refuse(`unknown Historical Imagination world ${args.world}`);
}

const visited = new Set([args.world]);
const usedEdges = new Map();
let frontier = [args.world];

for (let level = 0; level < args.depth; level += 1) {
  const next = new Set();
  for (const current of frontier.sort()) {
    for (const edge of graph.edges) {
      if (edge.status === "refused") continue;
      let neighbor = null;
      if (edge.from === current) neighbor = edge.to;
      else if (edge.to === current) neighbor = edge.from;
      if (neighbor === null) continue;
      usedEdges.set(edge.id, edge);
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        next.add(neighbor);
      }
    }
  }
  frontier = [...next].sort();
  if (frontier.length === 0) break;
}

const worlds = [...visited]
  .sort()
  .map((id) => ({ ...graph.worldsById.get(id), admission: "none" }));
const edges = [...usedEdges.values()]
  .filter((edge) => visited.has(edge.from) && visited.has(edge.to))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((edge) => ({ ...edge, admission: "none" }));

process.stdout.write(
  `${JSON.stringify(
    {
      schema: "memento.context-pack/v0",
      origin_world: args.world,
      depth: args.depth,
      admission: "none",
      worlds,
      edges,
      notice:
        "Retrieved context is scoped testimony. Retrieval does not admit it into the origin world.",
    },
    null,
    2,
  )}\n`,
);
