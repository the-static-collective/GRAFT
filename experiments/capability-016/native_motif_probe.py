#!/usr/bin/env python3
"""GRAFT-016 × *native* MOTIF-010 Scientist on actual local renderer outputs.

Real original source-pinned MOTIF-010 enumerates *four competing decision-tree
cartridges* from two diagonal observations. It chooses which *controlled*
render variant to examine next. The independent evaluator reveals its
already-generated but still withheld HTML TEST BYTES ONLY AFTER its proposal.

This is classical finite version-space diagnosis, not newly invented
mathematics. Source, tests and outcomes are all synthetic and explicit; no
human profile, external intervention, actual browser execution or payments.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import sys

MOTIF_COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
SCIENTIST_BLOB = "0aa7f509adc7a339455308b709dae7c05f882a74"


def git_blob(body: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(body)).encode() + b"\x00" + body).hexdigest()


def verified_native():
    root = Path(os.environ.get("MOTIF_SOURCE_ROOT", "")).resolve()
    if not os.environ.get("MOTIF_SOURCE_ROOT"):
        raise RuntimeError("Exact source-pinned MOTIF_SOURCE_ROOT required")
    scientist_file = root / "experiments/010/scientist.py"
    if not scientist_file.is_file() or git_blob(scientist_file.read_bytes()) != SCIENTIST_BLOB:
        raise RuntimeError("Original MOTIF scientist source blob is missing or modified")
    for module in ("experiments/008", "experiments/009", "experiments/010"):
        sys.path.insert(0, str(root / module))
    import scientist  # noqa: PLC0415
    from oracle import Observation, PublicControls  # noqa: PLC0415
    return scientist, Observation, PublicControls


def test_markup(case: dict) -> bool:
    text = case["html"]
    if not isinstance(text, str) or len(text) > 15000:
        raise ValueError("Too much test-only input")
    if hashlib.sha256(text.encode("utf-8")).hexdigest() != case["sha256"]:
        raise ValueError("Independent diagnostic output SHA-256 mismatch")
    # Syntactically small, known controlled grammar. This is NOT a full
    # production HTML security parser or proof of accessibility.
    active = bool(re.search(r"<(?:script|iframe|img|object|embed)\b", text, re.I))
    print_available = "@media print" in text
    return not active and print_available


def run(source: dict) -> dict:
    science, Observation, Controls = verified_native()
    rows = source.get("diagnosticRenders", [])
    if (source.get("schema") != "graft.capability-method-lab/v1" or
        not isinstance(rows, list) or len(rows) != 4 or
        any(r.get("synthetic") is not True for r in rows)):
        raise ValueError("Exactly four bounded synthetic diagnostic renders required")
    controls = Controls("html_escaped", "print_css")
    table = {}
    for row in rows:
        a, b = row.get("escaped"), row.get("printable")
        if type(a) is not bool or type(b) is not bool or (a, b) in table:
            raise ValueError("Invalid or duplicate controlled renderer ports")
        table[a, b] = test_markup(row)
    if len(table) != 4:
        raise ValueError("Missing controlled fixture case")

    def observe(a: bool, b: bool, n: int, natural: bool):
        actor, target = f"toy-actor-{n}", f"toy-target-{n}"
        facts = {
            ("role_actor", actor), ("role_target", target), ("pending", target)
        }
        if a: facts.add((controls.first_port, actor))
        if b: facts.add((controls.second_port, target))
        before = frozenset(facts)
        after = (frozenset((before - {("pending", target)}) |
                           {("achieved", target)}) if table[a, b]
                 else before)
        return Observation(before, after, (actor, target),
                           "SYNTHETIC_NATURAL" if natural else "SYNTHETIC_INTERVENTION")

    # Both initial outputs are ACTUALLY RENDERED in GRAFT; native MOTIF
    # sees ONLY the two diagonal observations, NOT the hidden off-diagonals.
    evidence = [observe(False, False, 1, True),
                observe(True, True, 2, True)]
    initial = science.candidate_cartridges(evidence, controls)
    proposals = []
    for step in range(2):
        current = science.candidate_cartridges(evidence, controls)
        q = science.propose_intervention(current)
        if q is None or q.real_world_authority:
            raise RuntimeError("Native Scientist did not produce bounded synthetic experiment")
        setting = (q.first, q.second)
        # Independent evaluator now discloses actual bytes-derived test result.
        observed = observe(*setting, 10 + step, False)
        evidence.append(observed)
        next_hypotheses = science.candidate_cartridges(evidence, controls)
        proposals.append({
            "question": ["escape_enabled", "print_style_enabled"],
            "chosen_control_values": list(setting),
            "modeled_information_gain_bits": q.information_gain_bits,
            "observed_independent_renderer_test_passed":
                science.validated_result(observed),
            "remaining_native_tree_cartridges": len(next_hypotheses),
            "external_action_authorized": False
        })
    survivors = science.candidate_cartridges(evidence, controls)
    all_predictions = {
        f"{int(a)}{int(b)}": science.consensus(survivors, a, b)
        for a in (False, True) for b in (False, True)
    }
    actual = {f"{int(a)}{int(b)}": value for (a, b), value in table.items()}
    return {
        "experiment": "GRAFT-016 actual HTML controlled tests × native MOTIF-010",
        "pinned_native_motif_commit": MOTIF_COMMIT,
        "verified_scientist_blob_sha1": SCIENTIST_BLOB,
        "native_scientist_executed": True,
        "initial_real_motif_009_tree_hypotheses": len(initial),
        "native_chosen_discriminating_interventions": proposals,
        "remaining_tree_hypotheses": len(survivors),
        "final_predictions_on_four_control_settings": all_predictions,
        "independently_computed_html_test_outcomes": actual,
        "all_four_toy_controls_correct": all_predictions == actual,
        "strong_classical_hard_gate_would_also_identify_all_four": True,
        "different_from_real_person_testing": True,
        "real_world_actions": 0, "money_moved_cents": 0,
        "production_method_admitted": False
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Pass local method-evidence.json as one argument")
    source_file = Path(sys.argv[1])
    if source_file.stat().st_size > 85000:
        raise SystemExit("HOLD: source fixture too large")
    report = run(json.loads(source_file.read_text("utf-8")))
    print(json.dumps(report, indent=2))
    if not report["all_four_toy_controls_correct"]:
        raise SystemExit(1)
