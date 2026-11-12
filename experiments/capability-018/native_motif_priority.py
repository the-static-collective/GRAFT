#!/usr/bin/env python3
"""Original source-verified MOTIF-003 selects a typed missing-primitive
hypothesis to investigate first. This is a small, hand-authored graph.
The Unicode semantics are NOT learned or invented by the graph: Intl.Segmenter
already implements Unicode grapheme segmentation in Node. Only branch ordering
is informed by the original MOTIF affordance search.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

ORIGINAL_COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
ORIGINAL_BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf"

MODES = (
    "constant-one",
    "utf16-units",
    "unicode-codepoints",
    "whitespace-tokens",
    "intl-graphemes",
)
CAPABILITY_DOORS = {
    "constant-one": ("fixed-example-counter",),
    "whitespace-tokens": ("whitespace-counter", "word-token-comparison"),
    "utf16-units": ("string-unit-counter", "js-text-buffer-counter", "unit-probe"),
    "unicode-codepoints": ("unicode-scalar-counter", "codepoint-diagnostic",
                           "utf8-comparison", "scalar-inspector"),
    "intl-graphemes": ("grapheme-boundary-counter", "combining-mark-probe",
                       "emoji-zwj-probe", "regional-flag-probe",
                       "accessible-reading-length"),
}


def load_original():
    if not os.environ.get("MOTIF_SOURCE_ROOT"):
        raise RuntimeError("Pinned original MOTIF_SOURCE_ROOT required")
    path = Path(os.environ["MOTIF_SOURCE_ROOT"]).resolve() / "experiments/003/affordance.py"
    if not path.is_file():
        raise RuntimeError("Missing pinned native MOTIF-003")
    b = path.read_bytes()
    digest = hashlib.sha1(b"blob " + str(len(b)).encode() + b"\x00" + b).hexdigest()
    if digest != ORIGINAL_BLOB:
        raise RuntimeError("Native MOTIF source has changed")
    spec = importlib.util.spec_from_file_location("native_motif_018", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Source-owned native module failed to load")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def options(world, _verbs):
    phase = next(v for k, v in world if k == "phase")
    if phase == "choose":
        for method in MODES:
            update = (world - {("phase", phase)}) | {
                ("phase", "explore"), ("mode", method)
            }
            yield ("choose-" + method, (method,), frozenset(update))
    elif phase == "explore":
        mode = next(v for k, v in world if k == "mode")
        for door in CAPABILITY_DOORS[mode]:
            update = (world - {("phase", phase)}) | {
                ("phase", "done"), ("reachable-tool", door)
            }
            yield ("inspect-" + door, (door,), frozenset(update))


def utility(_world, _initial):
    # No unearned utility scores or arbitrary dollar valuation.
    return 0


def run():
    original = load_original()
    world = frozenset({("phase", "choose"),
                       ("source", "public-synthetic-only"),
                       ("human-permission", "none-granted")})
    candidates = original.analyze_first_moves(
        world, None, options, utility, horizon=2, max_worlds=100
    )
    first = original.select_first_move(candidates, priority="new-choices")
    ranked = sorted(candidates, key=lambda x: (
        len(x["new_affordances"]), x["reachable_after_first_move"],
        x["operator"]), reverse=True)
    names = [x["operator"].removeprefix("choose-") for x in ranked]
    if sorted(names) != sorted(MODES) or len(set(names)) != 5:
        raise RuntimeError("Incomplete native comparison graph")
    if first["operator"] != "choose-intl-graphemes":
        raise RuntimeError("The intentionally authored graph opened unexpected options")
    return {
        "schema":"motif.native-missing-primitive-priority/v1",
        "status":"SOURCE_VERIFIED_STRUCTURAL_HINT_ONLY",
        "nativeSourceCommit":ORIGINAL_COMMIT,
        "nativeSourceBlob":ORIGINAL_BLOB,
        "ranOriginalAnalyzeFirstMoves":True,
        "ranOriginalSelectFirstMove":True,
        "recommendedFirstOperator":first["operator"],
        "candidatePriority":names,
        "hypotheticalAffordanceCounts":{
            x["operator"]:len(x["new_affordances"]) for x in candidates
        },
        "typeGraphIsHandAuthored":True,
        "calibratedNoveltyEvidence":False,
        "classicalTypeHeuristicMayTie":True,
        "actualPeopleContacted":0,
        "newUnicodeAlgorithmInvented":False,
        "realWorldAuthority":False
    }


if __name__ == "__main__":
    print(json.dumps(run(),indent=2))
