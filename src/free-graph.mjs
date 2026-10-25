#!/usr/bin/env node
// GRAFT native Free Graph traversal of Black Star -> MEMENTO reconstruction receipts.
// The actual Free Graph Python validator, hasher, and neighbors operation run unchanged.
import { reconstruct } from "./reconstruct.mjs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";

const PINNED_FREE_GRAPH = "ec0ad8743c5faac3f3675760bbafcbcb1df846c1";
const FIELDS = new Set(["cut", "world", "depth", "blackstar-root", "memento-root",
  "freegraph-root", "python", "graph-depth", "focus-world"]);
const safeWorld = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function refuse(value) {throw new Error(value);}
function command(command, args, env, data, failure) {
  const p = spawnSync(command, args, {
    encoding: "utf8", shell: false, timeout: 25000,
    maxBuffer: 2 * 1024 * 1024, env: env ?? process.env,
    input: data,
  });
  if (p.status !== 0 || p.error) refuse(failure);
  return p.stdout.trim();
}
function argsObject(argv) {
  if (argv.length % 2) refuse("INVALID_FLAGS");
  const args = {}, seen = new Set();
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].startsWith("--") ? argv[i].slice(2) : "";
    if (!FIELDS.has(key) || seen.has(key)) refuse("UNEXPECTED_OR_DUPLICATE_FLAG");
    seen.add(key);
    args[key] = argv[i + 1];
  }
  if (!args["freegraph-root"]) refuse("FREE_GRAPH_ROOT_REQUIRED");
  const depth = args["graph-depth"] === undefined ? 1 : Number(args["graph-depth"]);
  if (!Number.isInteger(depth) || depth < 0 || depth > 3) refuse("INVALID_GRAPH_DEPTH");
  const focus = args["focus-world"] || args["world"];
  if (typeof focus !== "string" || !safeWorld.test(focus)) refuse("INVALID_FOCUS_WORLD");
  const native = [];
  for (const key of ["cut","world","depth","blackstar-root","memento-root","python"]) {
    if (args[key] !== undefined) native.push("--" + key, args[key]);
  }
  return {args,native,depth,focus};
}
export function freeGraphReconstruction(argv) {
  const {args,native,depth,focus} = argsObject(argv);
  const root = resolve(args["freegraph-root"]);
  const sha = command("git", ["-C",root,"rev-parse","HEAD"],undefined,undefined,"FREE_GRAPH_ROOT_UNVERIFIED");
  if (sha !== PINNED_FREE_GRAPH) refuse("FREE_GRAPH_SOURCE_REF_MISMATCH");
  const receipt = reconstruct(native);
  const pyEnv = {
    ...process.env,
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONPATH: root + (process.env.PYTHONPATH ? ":" + process.env.PYTHONPATH : ""),
  };
  const response = command(args.python || "python3",
    [join(resolve(new URL(".",import.meta.url).pathname),"graph_worker.py")],
    pyEnv,JSON.stringify({receipt,focus,depth}),"FREE_GRAPH_NATIVE_REFUSED");
  let parsed;
  try {parsed = JSON.parse(response);} catch {_=>{}; refuse("FREE_GRAPH_NON_JSON");}
  if (!parsed || parsed.schema !== "graft.free-graph-reconstruction/v1"
      || parsed.authority !== "none" || parsed.effects !== "none"
      || parsed.owner_gate !== "NOT_INVOKED"
      || parsed.free_graph_packet?.schema !== "free-graph.packet/v0"
      || parsed.navigation?.depth !== depth
      || parsed.navigation?.focus_world !== focus) {
    refuse("FREE_GRAPH_AUTHORITY_VIOLATION");
  }
  return parsed;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {process.stdout.write(JSON.stringify(freeGraphReconstruction(process.argv.slice(2)),null,2)+"\n");}
  catch (e) {process.stderr.write("REFUSED: "+String(e.message||"UNKNOWN")+"\n");process.exitCode=1;}
}
