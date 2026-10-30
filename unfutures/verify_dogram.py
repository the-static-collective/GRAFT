#!/usr/bin/env python3
"""UNFUTURES-005: invoke ORIGINAL pinned Dogram Python, not a JS imitation.

Input: bounded synthetic JSON exported by experiment-demo.mjs.
Output: calculations, native receipts, counterexample controls and explicit
no-authority envelope. Does NOT use requests or perform external writes.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

from dogram.engine import evaluate_specimen
from dogram.receipt import canonical_receipt_bytes

DOGRAM_PIN = "551b5f9df18f17ec69b452ddcdff01718e0ff771"
EXPECTED = {
    "unfutures-005-main-rectangle": ("rectangle", 1),
    "unfutures-005-weighted-rectangle": ("rectangle", 1),
    "unfutures-005-control-rectangle": ("rectangle", 0),
    "unfutures-005-first-delta": ("delta", None),
    "unfutures-005-volunteer-ablate": ("ablate", None),
    "unfutures-005-bridge-reach": ("reach", None),
}


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit("usage: verify_dogram.py synthetic_specimens.json report.json")
    path, output = Path(sys.argv[1]), Path(sys.argv[2])
    ensure(path.is_file(), "Missing bounded fixture")
    ensure(path.stat().st_size < 120000, "Input exceeds synthetic bound")
    # CI separately verifies that checked-out Dogram Git HEAD equals pin.
    ensure(os.environ.get("UNFUTURES_DOGRAM_PIN") == DOGRAM_PIN,
           "Pinned original Dogram source was not declared by runner")
    payload = json.loads(path.read_text(encoding="utf-8"))
    ensure(payload.get("schema") == "unfutures.experiment-005/v0", "Wrong experiment schema")
    ensure(payload.get("environment") == "SYNTHETIC_ONLY", "No live inputs")
    ensure(payload.get("dogramSource", {}).get("ref") == DOGRAM_PIN, "Unpinned source")
    ensure(payload.get("admissions", {}).get("execute") is False, "Execution must remain forbidden")
    ensure(payload.get("admissions", {}).get("createRealEvidence") is False, "No field evidence claim")
    ensure(payload.get("preregistration", {}).get("realInterventions") == 0, "Not a fictional test")
    specimens = payload.get("specimens")
    ensure(isinstance(specimens, list) and len(specimens) == len(EXPECTED), "Wrong specimen count")
    ensure(len({s.get("specimen_id") for s in specimens}) == len(EXPECTED), "Duplicate specimen")
    ensure({s.get("specimen_id") for s in specimens} == set(EXPECTED), "Unexpected specimen")
    source_fingerprint = payload.get("sourceFingerprint")
    ensure(isinstance(source_fingerprint, str) and len(source_fingerprint) == 64,
           "Missing source identity")
    outcomes = payload.get("experiments")
    ensure(isinstance(outcomes, list) and len(outcomes) == 2, "Invalid arms")
    by_name = {t.get("hypothesisId"): t for t in outcomes}
    ensure(set(by_name) == {"h-pop-up-table", "h-route-table"}, "Invalid experiment ids")

    expected_main = by_name["h-pop-up-table"]["outcomeCountByArm"]
    expected_control = by_name["h-route-table"]["outcomeCountByArm"]
    for arm in ("00", "01", "10", "11"):
        ensure(type(expected_main.get(arm)) is int and type(expected_control.get(arm)) is int,
               "Arms must be exact integers")
    # Predeclare expected 2×2 comparison from actual exported measurement fields.
    declared = expected_main["11"]-expected_main["10"]-expected_main["01"]+expected_main["00"]
    ensure(declared == 1, "Frozen hypothesis no longer matches expected interaction")
    ensure(by_name["h-pop-up-table"]["exactInteractionExpected"] == declared,
           "Declared interaction diverges from arms")
    control = expected_control["11"]-expected_control["10"]-expected_control["01"]+expected_control["00"]
    ensure(control == 0, "Frozen non-improving control has unexpected interaction")
    ensure(by_name["h-route-table"]["exactInteractionExpected"] == control,
           "Control mismatch")

    receipts = []
    for specimen in specimens:
        name = specimen["specimen_id"]
        ensure(specimen.get("schema") == "dogram.specimen/v0", "Non-native specimen")
        ensure(specimen.get("operator_version") == 1, "Operator drift")
        ensure(specimen.get("operator") == EXPECTED[name][0], "Operator mismatch")
        meta = specimen.get("metadata", {})
        ensure(meta.get("dogramGitSha") == DOGRAM_PIN, "Specimen source pin mismatch")
        ensure(meta.get("sourceFingerprint") == source_fingerprint, "Specimen-source mismatch")
        ensure(meta.get("authority") == "NONE" and meta.get("scope") == "SYNTHETIC_ONLY",
               "Improper authority label")
        receipt = evaluate_specimen(specimen)  # Original Dogram's native engine.
        ensure(receipt.get("schema") == "dogram.receipt/v0", "Wrong native receipt")
        ensure(receipt.get("status") == "OK", f"Dogram refused {name}: {receipt}")
        ensure(receipt.get("operator") == specimen["operator"], "Wrong operator return")
        result = receipt.get("result")
        if name.endswith("rectangle"):
            ensure(result["mode"] == "numeric", "Not numeric rectangle")
            delta = result["mixed_delta"]
            ensure(delta == {"kind": "integer", "value": EXPECTED[name][1]},
                   f"Bad native exact interaction: {name}: {delta}")
            ensure(result["interaction_detected"] == (EXPECTED[name][1] != 0),
                   "Bad interaction flag")
        elif name == "unfutures-005-first-delta":
            ensure(result["first_difference"] == "goal_count",
                   "Dogram ordered trace failed to distinguish first boundary")
            ensure(len(result["comparisons"]) == 2, "Missing delta boundaries")
        elif name == "unfutures-005-volunteer-ablate":
            report = result["requested_targets"]
            recipe_to_goal = next(x for x in report
                                  if x["source"] == "recipe" and x["target"] == "goal")
            independent = next(x for x in report
                               if x["source"] == "proposed-service" and x["target"] == "goal")
            ensure(recipe_to_goal["reachable_before"] is True and
                   recipe_to_goal["reachable_after"] is False,
                   "Ablation did not expose serial gate dependence")
            ensure(independent["reachable_before"] is True and
                   independent["reachable_after"] is True,
                   "Ablation damaged unrelated reachability control")
            ensure(result["gained_reachability"] == [], "Ablation gained new paths unexpectedly")
        elif name == "unfutures-005-bridge-reach":
            report = result["queries"]
            guarded = next(x for x in report
                           if x["source"] == "recipe" and x["target"] == "goal")
            ensure(guarded["reachable_before"] is False and
                   guarded["reachable_after"] is True and guarded["changed"] is True,
                   "Declared branch did not show correct missing bridge")
        encoded = canonical_receipt_bytes(receipt)
        receipts.append({
            "id": name,
            "nativeReceipt": receipt,
            "nativeReceiptSha256": hashlib.sha256(encoded).hexdigest(),
        })
    # Hostile controls: Dogram itself must refuse malformed and mixed-mode specimens.
    hostile = json.loads(json.dumps(specimens[0]))
    hostile["inputs"]["cells"]["11"] = {"kind": "opaque", "value": "pretend"}
    refusal = evaluate_specimen(hostile)
    ensure(refusal["status"] == "REFUSE" and refusal.get("reason_code") == "MIXED_VALUE_MODES",
           f"Original Dogram failed mixed-mode hostile control: {refusal}")

    report = {
        "schema": "unfutures.dogram-native-witness-005/v0",
        "scope": "SYNTHETIC_ONLY",
        "dogramOriginalSourcePin": DOGRAM_PIN,
        "sourceFingerprint": source_fingerprint,
        "status": "ALL_EXACT_CHECKS_PASSED",
        "nativeCalculations": len(receipts),
        "receipts": receipts,
        "hostileControl": {
            "kind": "numeric-opaque-mixed-mode",
            "nativeStatus": refusal["status"],
            "reasonCode": refusal["reason_code"],
        },
        "mathematicalObservation": {
            "mainInteractionGoalCount": declared,
            "negativeControlInteraction": control,
            "graphMeaning": "DECLARED_SERIAL_REACHABILITY_ONLY",
            "notCausalEvidence": True,
            "notActualVolunteers": True,
            "notVerifiedRealDeliveries": True,
        },
        "realWorkAuthorized": False,
        "realFieldEvidenceProduced": False,
        "automaticHumanAssignment": False,
        "interpretationAuthority": "NONE",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, sort_keys=True, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    print(json.dumps({
        "status": report["status"],
        "nativeDogramReceipts": report["nativeCalculations"],
        "exactMixedDelta": declared,
        "negativeControl": control,
        "hostileRefusal": refusal["reason_code"],
        "realWork": 0,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
