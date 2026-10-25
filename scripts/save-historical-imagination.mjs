#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import {
  REGISTRY_SCHEMA,
  validateHistoricalImaginations,
} from "./lib/historical-imaginations.mjs";

const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const APPROVED_ROOTS = [
  "characters",
  "world",
  "materials",
  "plot",
  "outlines",
  "chapters",
  "style",
  "project.md",
];

function refuse(message) {
  process.stderr.write(`REFUSED: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = { root: process.cwd(), sourceDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--id") result.id = value;
    else if (arg === "--title") result.title = value;
    else if (arg === "--source-cut") result.sourceCut = value;
    else if (arg === "--source-dir") result.sourceDir = resolve(value);
    else if (arg === "--root") result.root = resolve(value);
    else refuse(`unknown argument ${arg}`);
    index += 1;
  }
  if (!result.id || !result.title || !result.sourceCut) {
    refuse(
      "usage: node scripts/save-historical-imagination.mjs --id ID --title TITLE --source-cut CUT [--source-dir PATH] [--root PROJECT_ROOT]",
    );
  }
  return result;
}

function yamlDouble(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function assertNoSymlinks(path, label) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) refuse(`${label} contains a symlink: ${path}`);
  if (!stat.isDirectory()) return;
  for (const name of readdirSync(path)) {
    assertNoSymlinks(join(path, name), label);
  }
}

function collectApproved(sourceDir) {
  if (!existsSync(sourceDir) || !lstatSync(sourceDir).isDirectory()) {
    refuse(`source directory does not exist or is not a directory: ${sourceDir}`);
  }
  const selected = [];
  for (const name of APPROVED_ROOTS) {
    const source = join(sourceDir, name);
    if (!existsSync(source)) continue;
    assertNoSymlinks(source, `approved source root ${name}`);
    if (name === "project.md" && !lstatSync(source).isFile()) {
      refuse("approved source root project.md must be a file");
    }
    if (name !== "project.md" && !lstatSync(source).isDirectory()) {
      refuse(`approved source root ${name} must be a directory`);
    }
    selected.push({ name, source });
  }
  return selected.sort((a, b) => a.name.localeCompare(b.name));
}

const args = parseArgs(process.argv.slice(2));
if (!STABLE_ID.test(args.id)) refuse("world id must be a stable lowercase id");
if (typeof args.title !== "string" || args.title.length === 0) refuse("title must be non-empty");
if (typeof args.sourceCut !== "string" || args.sourceCut.length === 0) {
  refuse("source-cut must be non-empty");
}

const registryPath = resolve(args.root, "historical-imaginations", "registry.json");
let registryRaw;
let registry;
try {
  registryRaw = readFileSync(registryPath, "utf8");
  registry = JSON.parse(registryRaw);
} catch (error) {
  refuse(`cannot read Historical Imaginations registry: ${error.message}`);
}
if (registry.schema !== REGISTRY_SCHEMA || !Array.isArray(registry.worlds)) {
  refuse("Historical Imaginations registry has unsupported shape");
}
if (registry.worlds.some((world) => world.id === args.id)) {
  refuse(`Historical Imagination world already exists: ${args.id}`);
}

const destination = resolve(
  args.root,
  "historical-imaginations",
  "instances",
  args.id,
);
if (existsSync(destination)) refuse(`Historical Imagination destination already exists: ${args.id}`);

const approved = args.sourceDir ? collectApproved(args.sourceDir) : [];
const staging = resolve(
  args.root,
  "historical-imaginations",
  "instances",
  `.staging-${args.id}-${process.pid}`,
);
if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

const now = new Date().toISOString();
const day = now.slice(0, 10);
const worldBody = `---\nworld_id: ${args.id}\ntype: historical_imagination\ntitle: ${yamlDouble(args.title)}\nstatus: seed\nsource_cut: ${yamlDouble(args.sourceCut)}\ncreated: ${day}\nupdated: ${day}\n---\n# ${args.title}\n\n## Scope\n\nThis directory is a durable Historical Imagination instance. Retrieval does not make its contents canon in another world.\n`;

try {
  writeFileSync(join(staging, "WORLD.md"), worldBody);
  for (const item of approved) {
    const target = join(staging, item.name);
    cpSync(item.source, target, { recursive: item.name !== "project.md" });
  }
  renameSync(staging, destination);

  const nextRegistry = {
    ...registry,
    worlds: [
      ...registry.worlds,
      {
        id: args.id,
        title: args.title,
        status: "seed",
        world_ref: `historical-imaginations/instances/${args.id}/WORLD.md`,
        source_cut: args.sourceCut,
        created_at: now,
        updated_at: now,
      },
    ].sort((a, b) => a.id.localeCompare(b.id)),
  };
  writeFileSync(registryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`);
  validateHistoricalImaginations(args.root);
} catch (error) {
  rmSync(staging, { recursive: true, force: true });
  rmSync(destination, { recursive: true, force: true });
  writeFileSync(registryPath, registryRaw);
  refuse(error.message);
}

process.stdout.write(
  `${JSON.stringify(
    {
      schema: "memento.world-save-receipt/v0",
      status: "saved",
      world_id: args.id,
      world_ref: relative(args.root, join(destination, "WORLD.md")).replaceAll("\\", "/"),
      copied_roots: approved.map((item) => basename(item.name)).sort(),
      authority: "addressed-world-not-canon",
    },
    null,
    2,
  )}\n`,
);
