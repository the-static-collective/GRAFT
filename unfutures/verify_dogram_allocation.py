#!/usr/bin/env python3
"""006: Run original Dogram internal exact-rational and anti-collapse kernels.

No real allocation. Every source is an explicit frozen synthetic input.
This research function is NOT Dogram's public dogram.receipt/v0 operator.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from dataclasses import asdict
from fractions import Fraction
from pathlib import Path

from dogram.budget_rounding_residual import receipt_integer_budget
from dogram.anti_collapse_reachability import analyze_collapse

PIN = "551b5f9df18f17ec69b452ddcdff01718e0ff771"
METHODS = ("largest_fractional_remainder", "declared_order_remainder")
BUDGETS = (7, 8, 9, 10)
ORDER = ("nourish", "winter", "table")
WEIGHTS = {"nourish": 5, "winter": 4, "table": 1}


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def canon(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def ration(text: str) -> Fraction:
    ensure(isinstance(text, str), "Non-exact rational")
    return Fraction(text)


def verify_trial(entry: dict, result: dict) -> dict:
    method, budget = entry["method"], entry["budget"]
    ensure(result["experiment"] == "BUDGET-ROUNDING-RESIDUAL-001", "Wrong native research operator")
    ensure(result["authority"] == "none", "Native Dogram tried to grant authority")
    ensure(result["method"] == method and result["budget"] == budget, "Trial drift")
    ensure(result["weights"] == WEIGHTS, "Changed weights")
    ensure(result["declared_order"] == list(ORDER), "Changed declared ordering")
    ensure(result["allocated_total"] == budget, "Budget not fully allocated")
    ensure(sum(result["allocation"].values()) == budget, "Budget conservation violated")
    ensure(ration(result["residual_sum"]) == 0, "Signed rounding residuals do not cancel")
    ensure(set(result["exact"]) == set(ORDER), "Incomplete exact shares")
    ensure(set(result["residuals"]) == set(ORDER), "Incomplete residue family")
    ensure(set(result["allocation"]) == set(ORDER), "Incomplete allocation family")
    ensure(all(type(v) is int and 0 <= v <= budget for v in result["allocation"].values()),
           "Invalid discrete allocation")
    for label, weight in WEIGHTS.items():
        ideal = Fraction(weight * budget, sum(WEIGHTS.values()))
        ensure(ration(result["exact"][label]) == ideal, "Exact fractional target mismatch")
        residue = Fraction(result["allocation"][label]) - ideal
        ensure(ration(result["residuals"][label]) == residue,
               "Individual residue mismatch")
        # Largest-remainder has a <1-unit residual bound. Declared-order does
        # NOT: the 8-kit case gives its first bin a full +1 excess. Preserve it.
        if method == "largest_fractional_remainder":
            ensure(abs(residue) < 1, "Largest-remainder residual exceeded one unit")
    zeros = [label for label in ORDER if result["allocation"][label] == 0]
    return {
        "id": entry["id"],
        "method": method,
        "budget": budget,
        "originalResearchReceipt": result,
        "nativeReceiptSha256": hashlib.sha256(canon(result)).hexdigest(),
        "zeroAssignments": zeros,
        "atLeastOneUnitResiduals": [
            label for label in ORDER
            if abs(ration(result["residuals"][label])) >= 1
        ],
        "roundingResidualMagnitude": str(sum(
            abs(ration(value)) for value in result["residuals"].values()
        )),
    }


def main() -> int:
    ensure(len(sys.argv) == 3, "usage: verify_dogram_allocation.py input.json output.json")
    src, output = Path(sys.argv[1]), Path(sys.argv[2])
    ensure(src.is_file() and src.stat().st_size < 60000, "Oversized or missing fixture")
    ensure(os.environ.get("UNFUTURES_DOGRAM_PIN") == PIN, "Missing exact Dogram source pin")
    source = json.loads(src.read_text(encoding="utf-8"))
    ensure(source.get("schema") == "unfutures.dogram-allocation-006/v0", "Wrong fixture schema")
    ensure(source.get("environment") == "SYNTHETIC_ONLY", "Live data disallowed")
    ensure(source.get("sourceDogramPin") == PIN, "Unpinned Dogram")
    ensure(source.get("noExternalSystems") is True, "Live systems disallowed")
    ensure(source.get("noActualDistribution") is True, "Actual allocations disallowed")
    ensure(source.get("noAuthenticatedActors") is True, "No authenticated participants")
    ensure(source.get("candidateRules", {}).get("forbidAutomatedDistribution") is True,
           "Automated distribution prohibited")
    fingerprint = source.get("sourceFingerprint")
    ensure(isinstance(fingerprint, str) and len(fingerprint) == 64,
           "Missing source fingerprint")
    trials = source.get("trials")
    ensure(isinstance(trials, list) and len(trials) == 8, "Must declare exactly 8 trials")
    ensure([(x.get("budget"), x.get("method")) for x in trials] ==
           [(b, m) for b in BUDGETS for m in METHODS], "Changed declared trial order")
    reports: list[dict] = []
    for trial in trials:
        budget = trial["budget"]
        ensure(type(budget) is int and budget in BUDGETS, "Illegal budget")
        ensure(trial["weights"] == WEIGHTS and
               list(trial["weights"]) == list(ORDER), "Noncanonical policy weights")
        ensure(trial["declaredOrder"] == list(ORDER), "Unexpected editorial order")
        ensure(trial["inputUnit"] == "general_supply_kit/kit", "Different resource unit")
        ensure(trial["unitAuthority"] == "NONE" and trial["state"] == "HOLD",
               "Cannot distribute resources")
        ensure(trial["expectedConservation"] == budget, "Changed conservation invariant")
        receipt = receipt_integer_budget(trial["weights"], budget, method=trial["method"])
        reports.append(verify_trial(trial, receipt))
    by = {(row["budget"], row["method"]): row for row in reports}
    # Frozen native-math controls: the exact scenario in Dogram's own research.
    ensure(by[(7, METHODS[0])]["originalResearchReceipt"]["allocation"] ==
           {"nourish": 3, "winter": 3, "table": 1}, "Largest remainder control changed")
    ensure(by[(7, METHODS[1])]["originalResearchReceipt"]["allocation"] ==
           {"nourish": 4, "winter": 3, "table": 0}, "Declared-order control changed")
    ensure(by[(8, METHODS[1])]["atLeastOneUnitResiduals"] == ["nourish"],
           "Declared-order full-unit rounding deviation disappeared")
    for budget in (7, 8, 9):
        ensure(by[(budget, METHODS[1])]["zeroAssignments"] == ["table"],
               "Expected zero-allocation test disappeared")
        ensure(by[(budget, METHODS[0])]["zeroAssignments"] == [],
               "Unexpected zero in largest remainder control")
    for method in METHODS:
        ensure(by[(10, method)]["zeroAssignments"] == [],
               "Budget-10 full coverage control failed")
    states = tuple(f"{row['budget']}:{row['method']}" for row in reports)
    rich = tuple(json.dumps({
        "budget": row["budget"],
        "allocation": row["originalResearchReceipt"]["allocation"],
        "residuals": row["originalResearchReceipt"]["residuals"],
    }, sort_keys=True) for row in reports)
    total_only = tuple(str(row["originalResearchReceipt"]["allocated_total"]) for row in reports)
    # Native Dogram internal information-loss instrument; this is not a public v0 operator.
    audit = analyze_collapse(states, rich, total_only)
    ensure(audit.lawful_quotient is True, "Collapsed representation not lawful")
    ensure(len(audit.lost_distinctions) == 3,
           "Budget totals should erase 7/8/9 policy differences, not more")
    ensure(all(pair[0].split(":")[0] == pair[1].split(":")[0]
               for pair in audit.lost_distinctions), "A lost pair crosses budget sizes")
    # Hostile control: an information-adding pseudo-collapse is not a lawful quotient.
    hostile = analyze_collapse(("a", "b"), ("same", "same"), ("left", "right"))
    ensure(hostile.lawful_quotient is False and
           hostile.factorization_witness is None,
           "Dogram admitted information-creating pseudo-collapse")
    # Hostile native controls: boolean-as-integer and oversubscription are refused.
    for bad_weights, bad_budget in (({"nourish": True, "winter": 4, "table": 1}, 7),
                                    (WEIGHTS, -1), ({}, 7)):
        try:
            receipt_integer_budget(bad_weights, bad_budget)
        except ValueError:
            continue
        raise RuntimeError("Dogram unexpectedly admitted invalid allocation input")
    zeros = [{"budget": row["budget"], "method": row["method"], "program": label}
             for row in reports for label in row["zeroAssignments"]]
    report = {
        "schema": "unfutures.dogram-allocation-witness-006/v0",
        "environment": "SYNTHETIC_ONLY",
        "status": "ALL_EXACT_MATH_CHECKS_PASSED",
        "sourceFingerprint": fingerprint,
        "source005Fingerprint": source["source005"],
        "dogramSourcePin": PIN,
        "originalNativeResearch": [
            "dogram.budget_rounding_residual.receipt_integer_budget",
            "dogram.anti_collapse_reachability.analyze_collapse",
        ],
        "trialCount": len(reports),
        "reports": reports,
        "zeroAllocationCases": zeros,
        "informationLoss": {
            "lawfulQuotient": audit.lawful_quotient,
            "lostDistinctions": len(audit.lost_distinctions),
            "lostPairs": [list(p) for p in audit.lost_distinctions],
            "preservedDistinctions": len(audit.preserved_distinctions),
            "warnings": [
                "Total-only projection hides the distribution differences.",
                "This is a declared data-projection loss, not fairness or causality.",
            ],
        },
        "hostileControls": {
            "informationAddingPseudoCollapse": "REFUSED",
            "booleanWeight": "REFUSED",
            "negativeBudget": "REFUSED",
            "emptyWeights": "REFUSED",
        },
        "meaning": "EXACT_ARITHMETIC_NOT_EQUITY_MEASUREMENT",
        "actualDistributedUnits": 0,
        "actualChildrenOrFamilies": 0,
        "realParticipantConsent": 0,
        "automatedDistribution": False,
        "authority": "NONE",
        "sourceMaySelectFairnessPolicy": False,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(canon(report) + b"\n")
    print(json.dumps({
        "status": report["status"],
        "nativeBudgetReceipts": report["trialCount"],
        "budget7Largest": by[(7, METHODS[0])]["originalResearchReceipt"]["allocation"],
        "budget7Declared": by[(7, METHODS[1])]["originalResearchReceipt"]["allocation"],
        "maskedPolicyDifferences": report["informationLoss"]["lostDistinctions"],
        "zeroAllocationWarnings": len(zeros),
        "actualDistributedUnits": 0,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
