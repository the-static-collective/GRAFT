#!/usr/bin/env python3
"""Read-only Free Graph projection of a validated GRAFT reconstruction receipt.

Free Graph's own fg_ops.rehash_packet and fg_core.validate_packet
own the schema/addressing rules; this file only maps source-native receipt concepts.
No evidence bytes or MEMENTO owner admissions are imported.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys

from scripts.fg_core import validate_packet
from scripts.fg_ops import neighbors, rehash_packet

SOURCE_REFS = {
    "blackstar": "08f42f769f9590d78b85c8d84358e1791d5bd318",
    "memento": "22a5714f25c7be59bac37b3ab691c28c1f036845",
}
SAFE_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SHA = re.compile(r"^[0-9a-f]{64}$")
EDGE_STATUS = {"proposed": "proposed", "fog": "unresolved",
               "refused": "refused", "admitted": "observed"}

def fail(code: str):
    raise ValueError(code)

def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode("utf-8")

def sha(value):
    return "sha256:" + hashlib.sha256(canonical(value)).hexdigest()

def source(id_, source_class, digest, system, revision, coordinate, note):
    return {
        "id": id_, "source_class": source_class,
        "locator": {
            "system": system, "coordinate": coordinate, "revision": revision,
            "resolution": "digest-only bounded provenance",
        },
        "observed_at": "unstamped-replay", "acquisition": "pinned native CLI",
        "digest": digest, "access": "private", "export": "pointer-only",
        "redaction": note,
        "authority": "none" if source_class == "conversation-witness" else "source-local",
    }

def packet_from_receipt(receipt: dict):
    if not isinstance(receipt, dict):
        fail("INVALID_RECONSTRUCTION_RECEIPT")
    if (receipt.get("schema") != "graft.reconstruction-receipt/v1"
        or receipt.get("authority") != "none"
        or receipt.get("side_effects") != "none"
        or receipt.get("disposition") != "PROPOSE_ONLY"
        or receipt.get("donor_refs") != SOURCE_REFS):
        fail("UNTRUSTED_RECONSTRUCTION_AUTHORITY")
    proposal = receipt.get("proposal")
    bs = receipt.get("blackstar")
    me = receipt.get("memento")
    if not all(isinstance(x, dict) for x in (proposal, bs, me)):
        fail("MISSING_ORGANS")
    if (proposal.get("gate") != "NOT_INVOKED"
        or proposal.get("local_write") != "NOT_PERFORMED"
        or proposal.get("admission") != "none"
        or bs.get("native_validation") != "PASS"
        or me.get("native_context") != "COMPILED"
        or me.get("admission") != "none"):
        fail("ADMISSION_OR_VALIDATION_MISMATCH")
    cut_sha = bs.get("source_sha256")
    if not isinstance(cut_sha, str) or not SHA.fullmatch(cut_sha):
        fail("INVALID_CUT_DIGEST")
    worlds = me.get("world_ids")
    relations = me.get("relations")
    origin = me.get("origin_world")
    if (not isinstance(worlds, list) or not worlds or len(worlds) > 1024
        or not isinstance(relations, list) or len(relations) > 2048
        or not isinstance(origin, str) or origin not in worlds
        or any(not isinstance(w, str) or not SAFE_ID.fullmatch(w) for w in worlds)
        or len(set(worlds)) != len(worlds)):
        fail("UNSAFE_WORLD_CONTEXT")
    for relation in relations:
        if (not isinstance(relation, dict)
            or not isinstance(relation.get("id"), str)
            or not SAFE_ID.fullmatch(relation["id"])
            or relation.get("from") not in worlds
            or relation.get("to") not in worlds
            or relation.get("status") not in EDGE_STATUS
            or relation.get("admission") != "none"):
            fail("UNSAFE_OR_PROMOTED_RELATION")
    if len({r["id"] for r in relations}) != len(relations):
        fail("DUPLICATE_RELATION_ID")

    source_ids = {"cut": "src-cut", "memento": "src-memento", "graft": "src-graft"}
    sources = [
        source(source_ids["cut"], "conversation-witness", "sha256:" + cut_sha,
               "Black Star", SOURCE_REFS["blackstar"], "cut sha256:" + cut_sha,
               "The original observer cut is not exported. Its validity is not factual corroboration."),
        source(source_ids["memento"], "specimen-receipt", sha(me),
               "MEMENTO", SOURCE_REFS["memento"], "addressed-world projection",
               "World context was compiled locally; this packet does not copy the source world records."),
        source(source_ids["graft"], "specimen-receipt", sha(receipt),
               "GRAFT RECONSTRUCTION-001", "graft.reconstruction-receipt/v1",
               "reconstruction sha256:" + sha(receipt)[7:],
               "Source reconstruction receipt is locally retrievable, not published by the graph."),
    ]
    nodes = []
    for world in worlds:
        nodes.append({
            "id": "world:" + world, "kind": "world",
            "label": "MEMENTO world: " + world,
            "status": "observed", "source_ids": [source_ids["memento"]],
            "world_key": world,
            "extensions": {"role": "retrieved-address-only", "admission": "none"},
        })
    nodes += [
        {"id": "receipt:reconstruction", "kind": "receipt",
         "label": "Black Star and MEMENTO reconstruction (proposal only)",
         "status": "tested", "source_ids": [source_ids["cut"], source_ids["graft"]],
         "extensions": {"gate": "NOT_INVOKED", "owner_authority": "none"}},
        {"id": "question:owner-gate", "kind": "question",
         "label": "What owner-current evidence and human decision would resolve this traversal?",
         "status": "unresolved", "source_ids": [source_ids["graft"]],
         "extensions": {"door": "owner-head-and-human-gate", "admission": "none"}},
    ]
    links = [
        {"id": "link:reconstruction-origin", "from": "receipt:reconstruction",
         "to": "world:" + origin, "verb": "connects",
         "qualifier": "scoped-reconstruction-origin-not-constitution",
         "status": "observed", "source_ids": [source_ids["graft"]],
         "authority": "none"},
        {"id": "link:open-question", "from": "receipt:reconstruction",
         "to": "question:owner-gate", "verb": "connects",
         "qualifier": "question-remains-unresolved-without-owner-gate",
         "status": "unresolved", "source_ids": [source_ids["graft"]],
         "authority": "none"},
    ]
    for r in relations:
        links.append({
            "id": "edge:" + r["id"], "from": "world:" + r["from"],
            "to": "world:" + r["to"], "verb": "connects",
            "qualifier": "memento-relation:" + r["id"]
               + "; native-status:" + r["status"] + "; exported-admission:none",
            "status": EDGE_STATUS[r["status"]],
            "source_ids": [source_ids["memento"]], "authority": "none",
            "extensions": {"native_status": r["status"], "admission": "none"},
        })
    ids = [x["id"] for x in [*sources, *nodes, *links]]
    result = {
        "schema": "free-graph.packet/v0",
        "purpose": "Bounded, non-authoritative navigation of a pinned Black Star and MEMENTO reconstruction",
        "modes": ["re-enter", "seed"],
        "scope": {
            "task": "Traverse a reconstructed historical idea neighborhood without promotion",
            "worlds": ["MEMENTO:" + w for w in worlds],
            "resolution": "pinned donor versions; address and relation-status only",
        },
        "task_world_cut": {
            "status": "unresolved",
            "selected_ids": ids,
            "owner_head_source_ids": [],
            "omitted": [{
                "door": "owner-current head, local MEMENTO crossing decision, human gate",
                "reason": "Reconstruction has no owner-current admission receipt or authority.",
            }],
            "rationale": "Selected inputs suffice to seed a graph traversal, not to prove or constitute local truth.",
        },
        "sources": sources, "nodes": nodes, "links": links,
        "residual_fog": [
            "Owner-current decision and adoption status were not established.",
            "Black Star cut validation establishes chronology, not the event's truth.",
        ] + (["Some MEMENTO edges are still proposals or in fog."] if
             any(x["status"] in ("proposed", "fog") for x in relations) else []),
        "non_imports": [
            "No original Black Star carrier bytes or witness transcript is published.",
            "No MEMENTO memories, story chapters, private source records or ledger are copied.",
            "No foreign source, model score or reachable graph edge is adopted as owner truth.",
            "No admission, write, effect, human consent or downstream authorization occurred.",
        ],
        "extensions": {
            "projection": "graft-reconstruction-into-free-graph-v1",
            "authority_effect": "none",
            "origin": origin,
            "read_only": True,
            "blackstar_ref": SOURCE_REFS["blackstar"],
            "memento_ref": SOURCE_REFS["memento"],
        },
    }
    packet = rehash_packet(result, stamp=True)
    if validate_packet(packet):
        fail("FREE_GRAPH_NATIVE_VALIDATION_FAILED")
    return packet

def main():
    payload = json.load(sys.stdin)
    if not isinstance(payload, dict) or not isinstance(payload.get("receipt"), dict):
        fail("INVALID_INPUT")
    depth = payload.get("depth", 1)
    if type(depth) is not int or depth < 0 or depth > 3:
        fail("INVALID_TRAVERSAL_DEPTH")
    packet = packet_from_receipt(payload["receipt"])
    focus = payload.get("focus") or payload["receipt"]["memento"]["origin_world"]
    if not isinstance(focus, str) or not SAFE_ID.fullmatch(focus):
        fail("INVALID_FOCUS")
    matching = [n for n in packet["nodes"] if n.get("world_key") == focus]
    if len(matching) != 1:
        fail("UNKNOWN_FOCUS_WORLD")
    projected = neighbors(packet, matching[0]["id"], depth)
    if validate_packet(projected):
        fail("FREE_GRAPH_NEIGHBORS_INVALID")
    output = {
        "schema": "graft.free-graph-reconstruction/v1",
        "authority": "none",
        "effects": "none",
        "owner_gate": "NOT_INVOKED",
        "free_graph_packet": packet,
        "neighborhood": projected,
        "navigation": {
            "focus_world": focus, "depth": depth,
            "packet_id": packet["packet_id"],
            "neighborhood_packet_id": projected["packet_id"],
            "view": "bounded-undirected-traversal-not-ancestry-proof",
        },
    }
    sys.stdout.write(json.dumps(output, sort_keys=True, indent=2) + "\n")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        sys.stderr.write("REFUSED: " + str(exc) + "\n")
        sys.exit(1)
