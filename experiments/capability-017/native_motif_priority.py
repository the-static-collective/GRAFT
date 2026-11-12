#!/usr/bin/env python3
"""GRAFT-017: source-pinned *native* MOTIF-003 structural branch ordering.

Four further operators become structurally possible only when the initial
text-normalization action provides an appropriate type. This toy affordance
graph was deliberately authored by the engineer: it is a heuristic, not
learned proof of safety or a magical ability to synthesize arbitrary code.

Original native MOTIF-003 is actually imported and invoked; its decision
is passed to the GRAFT-017 combinatorial synthesizer as branch priority.
"""
from __future__ import annotations
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

NATIVE_COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
NATIVE_BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf"


def load_native():
    if "MOTIF_SOURCE_ROOT" not in os.environ:
        raise RuntimeError("MOTIF source root must be an exact pinned checkout")
    path = Path(os.environ["MOTIF_SOURCE_ROOT"]).resolve() / "experiments/003/affordance.py"
    if not path.is_file():
        raise RuntimeError("Original source does not exist")
    content = path.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\x00" + content).hexdigest()
    if blob != NATIVE_BLOB:
        raise RuntimeError("Native original module source mismatch")
    spec = importlib.util.spec_from_file_location("native_motif_003_graft_017", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not inspect native implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def fictional_world():
    return frozenset({
        ("stage", "choose-text-policy"),
        ("data", "public-invented-strings"),
        ("permissions", "NO_REAL_ACTIONS")
    })


def options(state, _verbs):
    phase = next(value for name, value in state if name == "stage")
    if phase == "choose-text-policy":
        for policy in ("raw", "angles", "entities"):
            n = (state - {("stage", phase)}) | {
                ("stage", "choose-next-typed-operation"),
                ("text_policy", policy)
            }
            if policy == "entities":
                n |= {("available-type", "escaped-html-text")}
            elif policy == "angles":
                n |= {("available-type", "angle-only-text")}
            else:
                n |= {("available-type", "raw-text")}
            yield ("choose-" + policy, (policy,), frozenset(n))
    elif phase == "choose-next-typed-operation":
        policy = next(v for k, v in state if k == "text_policy")
        doors = {
            "raw": ["raw-paragraph"],
            "angles": ["plain-section", "plain-print-style"],
            "entities": [
                "semantic-card-sections", "indexed-card-labels",
                "language-annotated-document", "printer-friendly-layout"
            ]
        }
        for door in doors[policy]:
            new = (state - {("stage", phase)}) | {
                ("stage", "finish"),
                ("hypothetical-affordance", door)
            }
            yield ("follow-" + door, (door,), frozenset(new))


def zero_utility(state, initial):
    # The original 003 ranking uses NEW POSSIBLE NEXT ACTIONS here; no
    # imagined social welfare or invented monetary value is introduced.
    return 0


def run():
    native = load_native()
    rows = native.analyze_first_moves(
        fictional_world(), None, options, zero_utility,
        horizon=2, max_worlds=64
    )
    first = native.select_first_move(rows, priority="new-choices")
    priority = sorted(rows, key=lambda r: (
        len(r["new_affordances"]), len(r["new_skill_facts"]),
        r["immediate_delta"], r["reachable_after_first_move"]
    ), reverse=True)
    names = [row["operator"].removeprefix("choose-") for row in priority]
    if sorted(names) != ["angles", "entities", "raw"]:
        raise RuntimeError("Unexpected experimental primitive graph")
    if first["operator"] != "choose-entities":
        raise RuntimeError("Typed graph did not open expected highest affordance count")
    return {
        "schema": "motif.native-affordance-priority-for-graft-017/v1",
        "status": "SOURCE_VERIFIED_STRUCTURAL_HINT_ONLY",
        "native_source_commit": NATIVE_COMMIT,
        "original_file_git_blob_sha1": NATIVE_BLOB,
        "executed_original_motif_003_analyze_first_moves": True,
        "executed_original_motif_003_select_first_move": True,
        "first_native_operator": first["operator"],
        "escapeOperatorPriority": names,
        "observedToyAffordanceCounts": {
            row["operator"]: len(row["new_affordances"]) for row in rows
        },
        "classicalTypedHeuristicCouldMatchThisOrdering": True,
        "arbitraryProgramSynthesisProved": False,
        "realWorldAuthority": False
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
