#!/usr/bin/env node
// RECONSTRUCTION-001: native Black Star validation -> native MEMENTO context -> GRAFT proposal.
// No writer is invoked. In particular, no MEMENTO crossing is admitted.
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const PINNED = Object.freeze({
  blackstar: "08f42f769f9590d78b85c8d84358e1791d5bd318",
  memento: "22a5714f25c7be59bac37b3ab691c28c1f036845",
});
const MAX_CUT_BYTES = 65536;
const MAX_STDOUT_BYTES = 1024 * 1024;
const WORLD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function refuse(code) {
  throw new Error(code);
}
function parseOptions(argv) {
  const options = { depth: 1, python: "python3" };
  const allowed = new Set(["cut", "world", "depth", "blackstar-root", "memento-root", "python"]);
  const seen = new Set();
  if (argv.length % 2) refuse("INVALID_ARGUMENTS");
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const key = flag.startsWith("--") ? flag.slice(2) : "";
    if (!allowed.has(key) || typeof argv[i + 1] !== "string") refuse("INVALID_ARGUMENTS");
    if (seen.has(key)) refuse("DUPLICATE_ARGUMENT");
    seen.add(key);
    options[key] = argv[i + 1];
  }
  for (const name of ["cut", "world", "blackstar-root", "memento-root"]) {
    if (!options[name]) refuse("MISSING_" + name.toUpperCase().replaceAll("-", "_"));
  }
  const depth = Number(options.depth);
  if (!Number.isInteger(depth) || depth < 0 || depth > 3) refuse("INVALID_DEPTH");
  options.depth = depth;
  if (!WORLD_ID.test(options.world)) refuse("INVALID_WORLD_ID");
  return options;
}
function invoke(command, args, env, refusal) {
  const result = spawnSync(command, args, {
    encoding: "utf8", timeout: 20000, maxBuffer: MAX_STDOUT_BYTES,
    env: env || process.env, shell: false,
  });
  if (result.error || result.status !== 0) refuse(refusal);
  return String(result.stdout).trim();
}
function checkGitRoot(root, expected, label) {
  const found = invoke("git", ["-C", root, "rev-parse", "HEAD"], null,
    label + "_SOURCE_CHECKOUT_UNVERIFIED");
  if (found !== expected) refuse(label + "_SOURCE_REF_MISMATCH");
}
function parseNativeJson(body, label) {
  try {
    const value = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      refuse(label + "_INVALID_JSON");
    }
    return value;
  } catch (_) {
    refuse(label + "_INVALID_JSON");
  }
}
export function reconstruct(argv) {
  const options = parseOptions(argv);
  const blackstarRoot = resolve(options["blackstar-root"]);
  const mementoRoot = resolve(options["memento-root"]);
  const cutPath = resolve(options.cut);
  checkGitRoot(blackstarRoot, PINNED.blackstar, "BLACK_STAR");
  checkGitRoot(mementoRoot, PINNED.memento, "MEMENTO");
  let raw;
  try {
    if (!statSync(cutPath).isFile() || statSync(cutPath).size > MAX_CUT_BYTES) {
      refuse("CUT_SIZE_OR_TYPE_INVALID");
    }
    raw = readFileSync(cutPath);
  } catch (_) {
    refuse("CUT_UNAVAILABLE");
  }
  const digest = createHash("sha256").update(raw).digest("hex");
  // The original Black Star Python CLI validates the actual input cut, not a GRAFT reimplementation.
  const pyEnv = {
    ...process.env,
    PYTHONPATH: join(blackstarRoot, "src")
      + (process.env.PYTHONPATH ? ":" + process.env.PYTHONPATH : ""),
  };
  const cutCheck = parseNativeJson(
    invoke(options.python, ["-m", "blackstar", "--json", "validate-cut", cutPath],
      pyEnv, "BLACK_STAR_VALIDATION_REFUSED"),
    "BLACK_STAR");
  if (cutCheck.ok !== true || !Number.isInteger(cutCheck.details?.carrier_count)) {
    refuse("BLACK_STAR_VALIDATION_REFUSED");
  }
  // Native MEMENTO, not GRAFT's earlier narrower prototype, compiles the actual world context.
  const context = parseNativeJson(
    invoke(process.execPath, [
      join(mementoRoot, "scripts", "compile-context-pack.mjs"),
      "--world", options.world,
      "--depth", String(options.depth),
      "--root", mementoRoot,
    ], null, "MEMENTO_CONTEXT_REFUSED"),
    "MEMENTO");
  if (context.schema !== "memento.context-pack/v0" || context.admission !== "none"
      || context.origin_world !== options.world || context.depth !== options.depth
      || !Array.isArray(context.worlds) || !Array.isArray(context.edges)) {
    refuse("MEMENTO_CONTEXT_AUTHORITY_VIOLATION");
  }
  for (const world of context.worlds) {
    if (world.admission !== "none" || !WORLD_ID.test(world.id)) {
      refuse("MEMENTO_WORLD_AUTHORITY_VIOLATION");
    }
  }
  const statuses = { proposed: 0, admitted: 0, fog: 0, refused: 0 };
  for (const edge of context.edges) {
    if (edge.admission !== "none" || !Object.hasOwn(statuses, edge.status)
        || typeof edge.id !== "string") {
      refuse("MEMENTO_EDGE_AUTHORITY_VIOLATION");
    }
    statuses[edge.status] += 1;
  }
  return {
    schema: "graft.reconstruction-receipt/v1",
    disposition: "PROPOSE_ONLY",
    authority: "none",
    side_effects: "none",
    donor_refs: { blackstar: PINNED.blackstar, memento: PINNED.memento },
    blackstar: {
      native_validation: "PASS",
      source_sha256: digest,
      carrier_count: cutCheck.details.carrier_count,
      interpretation: "bounded-knowledge-horizon-not-event-truth",
    },
    memento: {
      native_context: "COMPILED",
      origin_world: context.origin_world,
      depth: context.depth,
      admission: "none",
      world_ids: context.worlds.map(w => w.id),
      relations: context.edges.map(e => ({
        id: e.id, from: e.from, to: e.to, status: e.status, admission: "none",
      })),
      relation_status_counts: statuses,
    },
    proposal: {
      type: "graft.memento-handoff-candidate/v1",
      id: "reconstruction-" + digest.slice(0, 20),
      source_ref: "sha256:" + digest,
      blackstar_cut_validated: true,
      memento_context_retrieved: true,
      gate: "NOT_INVOKED",
      local_write: "NOT_PERFORMED",
      admission: "none",
    },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    process.stdout.write(JSON.stringify(reconstruct(process.argv.slice(2)), null, 2) + "\n");
  } catch (error) {
    process.stderr.write("REFUSED: " + String(error.message || "UNKNOWN") + "\n");
    process.exitCode = 1;
  }
}
