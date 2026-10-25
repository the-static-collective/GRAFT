#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { FAMILY_DIRS, validateUnderstory } from "./lib/understory.mjs";

const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function refuse(message) {
  process.stderr.write(`REFUSED: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  if (argv.length === 1) {
    return { inputPath: resolve(argv[0]), root: process.cwd() };
  }
  if (argv.length === 3 && argv[1] === "--root") {
    return { inputPath: resolve(argv[0]), root: resolve(argv[2]) };
  }
  refuse("usage: node scripts/record-understory.mjs RECORD.json [--root PROJECT_ROOT]");
}

const { inputPath, root } = parseArgs(process.argv.slice(2));
let raw;
let record;
try {
  raw = readFileSync(inputPath, "utf8");
  record = JSON.parse(raw);
} catch (error) {
  refuse(`cannot read UNDERSTORY record: ${error.message}`);
}

if (!record || typeof record !== "object" || Array.isArray(record)) {
  refuse("UNDERSTORY record must be an object");
}
if (typeof record.id !== "string" || !STABLE_ID.test(record.id)) {
  refuse("UNDERSTORY record id must be a stable lowercase id");
}
const familyDir = FAMILY_DIRS[record.family];
if (!familyDir) refuse(`unknown UNDERSTORY family ${JSON.stringify(record.family)}`);

const destination = resolve(root, "understory", familyDir, `${record.id}.json`);
if (existsSync(destination)) refuse(`UNDERSTORY record already exists: ${record.id}`);
mkdirSync(dirname(destination), { recursive: true });

try {
  writeFileSync(destination, raw, { flag: "wx" });
  validateUnderstory(root);
} catch (error) {
  rmSync(destination, { force: true });
  refuse(error.message);
}

process.stdout.write(
  `${JSON.stringify(
    {
      schema: "memento.understory-write-receipt/v0",
      status: "recorded",
      record_id: record.id,
      family: record.family,
      path: relative(root, destination).replaceAll("\\", "/"),
      authority: "record-only-not-canon",
    },
    null,
    2,
  )}\n`,
);
