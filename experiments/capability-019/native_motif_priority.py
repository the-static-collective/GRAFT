#!/usr/bin/env python3
"""Native MOTIF-003 examines REAL NAND-derived Boolean function diversity.

It chooses a search-order heuristic WITHOUT being given the solution circuit.
Three possible first NAND gates: NAND(a,a), NAND(a,b), NAND(b,b).
For each first step we compute the distinct resulting Boolean functions that
depend on BOTH original inputs and are possible after one more NAND gate.
The original MOTIF-003 sees those genuinely reachable actions as affordances.

Counts: joint-input-dependent functions after one extra gate are 2,4,2.
This is a hand-selected domain heuristic, not general intelligence, and a
classical semantic-guided program enumerator can compute the same ranking.
"""
from __future__ import annotations
from itertools import combinations_with_replacement
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf"
TRUTH = ((0, 0), (0, 1), (1, 0), (1, 1))
FIRST = ((0, 0), (0, 1), (1, 1))
A = tuple(a for a, _ in TRUTH)
B = tuple(b for _, b in TRUTH)


def load_original():
    root = os.environ.get("MOTIF_SOURCE_ROOT")
    if not root:
        raise RuntimeError("MOTIF_SOURCE_ROOT must be a pinned exact original checkout")
    path = Path(root).resolve() / "experiments/003/affordance.py"
    if not path.is_file():
        raise RuntimeError("Original 003 source not found")
    b = path.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(b)).encode() + b"\x00" + b).hexdigest()
    if blob != BLOB:
        raise RuntimeError("Original 003 Git blob checksum does not match")
    spec = importlib.util.spec_from_file_location("source_motif003_nand019", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Original structural reasoning module unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def nand(lhs, rhs):
    return tuple(1 - (x * y) for x, y in zip(lhs, rhs))


def depends_on_both(table):
    depends_a = table[0] != table[2] or table[1] != table[3]
    depends_b = table[0] != table[1] or table[2] != table[3]
    return depends_a and depends_b


def reachable_joint_functions(first_pair):
    first = nand((A, B)[first_pair[0]], (A, B)[first_pair[1]])
    wires = (A, B, first)
    return sorted({
        nand(wires[u], wires[v])
        for u, v in combinations_with_replacement(range(3), 2)
        if depends_on_both(nand(wires[u], wires[v]))
    })


def transitions(world, _actions):
    phase = next(value for key, value in world if key == "phase")
    if phase == "pick":
        for a, b in FIRST:
            nxt = (world - {("phase", "pick")}) | {
                ("phase", "probe"),
                ("pair", str(a) + "," + str(b))
            }
            yield ("choose-" + str(a) + str(b), (a, b), frozenset(nxt))
    elif phase == "probe":
        pair = next(value for key, value in world if key == "pair")
        a, b = (int(x) for x in pair.split(","))
        for row in reachable_joint_functions((a, b)):
            key = "".join(str(bit) for bit in row)
            nxt = (world - {("phase", "probe")}) | {
                ("phase", "end"), ("joint-truth", key)
            }
            yield ("make-" + key, (key,), frozenset(nxt))


def no_social_value(_new, _old):
    return 0


def run():
    native = load_original()
    world = frozenset({("phase", "pick"),
                       ("source", "NAND-only"),
                       ("external-authority", "none")})
    rows = native.analyze_first_moves(
        world, None, transitions, no_social_value, horizon=2, max_worlds=64
    )
    top = native.select_first_move(rows, priority="new-choices")
    all_counts = {
        "choose-" + str(a) + str(b): len(reachable_joint_functions((a, b)))
        for a, b in FIRST
    }
    ranked_pairs = sorted(
        FIRST, key=lambda p: (-all_counts["choose-" + str(p[0]) + str(p[1])],
                              FIRST.index(p))
    )
    if top["operator"] != "choose-01" or ranked_pairs[0] != (0, 1):
        raise RuntimeError("Native original MOTIF gave unexpected structural ordering")
    # Confirm ranking isn't just a fabricated list unrelated to native output:
    observed = {row["operator"]: len(row["new_affordances"]) for row in rows}
    if observed != all_counts or all_counts != {
        "choose-00": 2, "choose-01": 4, "choose-11": 2
    }:
        raise RuntimeError("Native affordance facts differ from actual NAND semantics")
    return {
        "schema": "motif.native-nand-affordance-019/v1",
        "status": "SOURCE-VERIFIED-BOUNDED-HEURISTIC",
        "sourceCommit": COMMIT,
        "sourceBlob": BLOB,
        "originalAnalyzeFirstMovesExecuted": True,
        "originalSelectFirstMoveExecuted": True,
        "nativeHighestAffordanceGate": top["operator"],
        "nativeFirstGatePriority": [list(p) for p in ranked_pairs],
        "computedTwoStepDistinctJointInfluenceCounts": all_counts,
        "usesActualNandTruthTables": True,
        "domainMetricDesignedByEngineer": True,
        "classicalSemanticSearchCouldUseSameMetric": True,
        "noXorCircuitSuppliedToNativeModel": True,
        "noFinancialOrHumanAuthority": True
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
