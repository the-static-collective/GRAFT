"""UNFUTURES-007: finite discrete-allocation POLICY COMPARISON; not a fairness judge.

Four competing *explicitly chosen* objectives over fictional caps & promises.
Dogram native maths may be independently cross-checked at its exact Git pin.
No mutation of 001–006, no live distribution, no volunteer commitments.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction
from hashlib import sha256
from itertools import product
import argparse
import json
from pathlib import Path
import subprocess
import sys

PIN = "551b5f9df18f17ec69b452ddcdff01718e0ff771"
POLICIES = ("coverage_first", "max_min_first", "provisional_commitments_first", "proportional_fit_first")
IDS = ("nourish", "winter", "table")
WEIGHTS = (5, 4, 1)
CAPS = (4, 3, 2)
PROMISES = (4, 3, 0)
BUDGETS = (7, 8, 9, 10)
BUDGET_METHODS = ("largest_fractional_remainder", "declared_order_remainder")
# 006 frozen Dogram records, *not* claims of a new native calculation.
PARENT_EXPECTATIONS = {
  7: {"largest_fractional_remainder": (3,3,1), "declared_order_remainder": (4,3,0)},
  8: {"largest_fractional_remainder": (4,3,1), "declared_order_remainder": (5,3,0)},
  9: {"largest_fractional_remainder": (4,4,1), "declared_order_remainder": (5,4,0)},
 10: {"largest_fractional_remainder": (5,4,1), "declared_order_remainder": (5,4,1)},
}


def canonical(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def fraction_str(x: Fraction) -> str:
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def require(test, msg):
    if not test:
        raise ValueError(msg)


def validate(s):
    require(type(s) is dict and s.get("schema") == "unfutures.fairness-fixture-007/v0" and
            s.get("environment") == "SYNTHETIC_ONLY", "synthetic fixture only")
    src = s.get("source", {})
    require(src.get("origin") == "the-static-collective/GRAFT" and
            src.get("base_branch") == "graft/unfutures-006-dogram-allocation" and
            src.get("source_dogram_pin") == PIN and
            src.get("source_exp") == "UNFUTURES-006", "original source pin missing")
    resource = s.get("resource", {})
    require(resource.get("name") == "fictional_general_supply_kit" and
            resource.get("unit") == "kit" and resource.get("actual_inventory") is False,
            "no real resource allowed")
    groups=s.get("groups", [])
    require(type(groups) is list and len(groups) == 3, "exactly three fictional groups")
    require(tuple(g.get("id") for g in groups) == IDS and
            all(type(g.get("weight")) is int for g in groups) and
            tuple(g["weight"] for g in groups) == WEIGHTS and
            all(type(g.get("max_capacity")) is int for g in groups) and
            tuple(g["max_capacity"] for g in groups) == CAPS and
            all(type(g.get("provisional_commitment")) is int for g in groups) and
            tuple(g["provisional_commitment"] for g in groups) == PROMISES,
            "frozen editorial parameters were changed")
    require(s.get("budgets") == list(BUDGETS) and s.get("policies") == list(POLICIES),
            "frozen policy and budget boundary changed")
    a=s.get("assumptions", {})
    for k in ("weights_editorial_not_measured_needs", "caps_editorial_not_certified",
              "commitments_simulated_not_real", "maximum_utilization_preference"):
        require(a.get(k) is True, "required uncertainty label missing: "+k)
    require(a.get("participants_enrolled") == 0 and type(a.get("participants_enrolled")) is int and
            a.get("physical_distribution_units") == 0 and type(a.get("physical_distribution_units")) is int and
            a.get("authority") == "NONE" and a.get("state") == "HOLD", "no human authority")
    return True


def outcomes(budget):
    """All feasible nonnegative integer triplets, with no assumed resource creation."""
    require(type(budget) is int and budget in BUDGETS, "illegal budget")
    xs = tuple(x for x in product(*(range(cap+1) for cap in CAPS)) if sum(x) <= budget)
    max_spent = max(sum(x) for x in xs)
    # The maximum-utilization preference is a declared policy *constraint*.
    # No mechanism silently assumes resources can exceed safe caps.
    return tuple(x for x in xs if sum(x)==max_spent)


def measurements(x, budget):
    require(type(budget) is int and budget in BUDGETS, "invalid budget")
    require(type(x) is tuple and len(x)==3 and all(type(n) is int for n in x) and
            all(0 <= n <= c for n,c in zip(x,CAPS)) and sum(x)<=budget, "invalid allocation")
    ideal=tuple(Fraction(budget*w,sum(WEIGHTS)) for w in WEIGHTS)
    residuals=tuple(Fraction(x_i)-target for x_i,target in zip(x,ideal))
    shortfalls=tuple(max(0,p-x_i) for x_i,p in zip(x,PROMISES))
    return {
        "allocation":dict(zip(IDS,x)),
        "budget":budget,
        "allocated_total":sum(x),
        "unused":budget-sum(x),
        "coverage_count":sum(n>0 for n in x),
        "minimum_access":min(x),
        "weighted_priority_proxy":sum(w*n for w,n in zip(WEIGHTS,x)),
        "provisional_commitments_satisfied":sum(x_i>=p for x_i,p in zip(x,PROMISES)),
        "provisional_commitment_shortfalls":dict(zip(IDS,shortfalls)),
        "total_commitment_shortfall":sum(shortfalls),
        "exact_ideals":dict(zip(IDS,map(fraction_str,ideal))),
        "exact_residuals":dict(zip(IDS,map(fraction_str,residuals))),
        "exact_absolute_deviation":fraction_str(sum(map(abs,residuals),Fraction(0))),
        "signed_residual_sum":fraction_str(sum(residuals,Fraction(0))),
        "zero_groups":[id_ for id_,n in zip(IDS,x) if n==0],
        "scope":"SYNTHETIC_ONLY"
    }


def rank(x,budget,policy):
    m=measurements(x,budget)
    coverage=m["coverage_count"]
    weighted=m["weighted_priority_proxy"]
    satisfied=m["provisional_commitments_satisfied"]
    lost=m["total_commitment_shortfall"]
    minimum=m["minimum_access"]
    balance=tuple(sorted(x))
    deviation=sum(abs(Fraction(n)-Fraction(budget*w,sum(WEIGHTS))) for n,w in zip(x,WEIGHTS))
    if policy == "coverage_first":
        return (coverage,weighted,satisfied,-lost,x)
    if policy == "max_min_first":
        return (minimum,balance,coverage,weighted,-lost,x)
    if policy == "provisional_commitments_first":
        return (satisfied,-lost,weighted,coverage,minimum,x)
    if policy == "proportional_fit_first":
        return (-deviation,coverage,satisfied,weighted,x)
    raise ValueError("unregistered policy")


def pick(budget,policy):
    require(policy in POLICIES, "unregistered policy")
    candidates=outcomes(budget)
    # Deterministic mathematical optimization over the FULL finite candidate set.
    winner=max(candidates,key=lambda x:rank(x,budget,policy))
    return {
        "policy":policy,
        "candidate_count":len(candidates),
        "decision_basis":"MAXIMUM_UTILIZATION_HARD_CONSTRAINT_THEN_DECLARED_LEXICOGRAPHIC_OBJECTIVE",
        "metrics":measurements(winner,budget),
        "status":"PROPOSAL_ONLY_NOT_APPLIED"
    }


def read_scenario(path):
    p=Path(path)
    require(p.is_file() and p.stat().st_size < 25000,"missing or oversized fixture")
    d=json.loads(p.read_text(encoding="utf-8"))
    validate(d)
    return d


def dogram_native_optional(source_dir,budgets=BUDGETS):
    """Only original Dogram source at EXACT pin qualifies as native witness.

    Optional for local tests; CI requires it and proves checksum against original.
    No vendored reimplementation is ever labeled native.
    """
    if source_dir is None:
        return {"status":"NOT_RUN", "reason":"original Dogram checkout not supplied"}
    src=Path(source_dir).resolve()
    try:
        revision=subprocess.check_output(["git","-C",str(src),"rev-parse","HEAD"],text=True).strip()
    except (OSError,subprocess.CalledProcessError) as e:
        raise ValueError("Original Dogram Git checkout required") from e
    require(revision==PIN, "wrong Dogram source revision")
    sys.path.insert(0,str(src))
    try:
        from dogram.budget_rounding_residual import receipt_integer_budget
        from dogram.anti_collapse_reachability import analyze_collapse
        from dogram.canonical import sha256_json
    finally:
        sys.path.pop(0)
    records=[]
    for budget in budgets:
        for method in BUDGET_METHODS:
            # Ordered dict from fixture: nour, winter, table.
            actual=receipt_integer_budget(dict(zip(IDS,WEIGHTS)),budget,method=method)
            require(actual["authority"]=="none" and actual["allocated_total"]==budget,"not a native Dogram witness")
            require(tuple(actual["allocation"][id_] for id_ in IDS)==PARENT_EXPECTATIONS[budget][method],
                    "Dogram expected allocation drift")
            records.append({"budget":budget,"method":method,"originalResearchReceipt":actual,
                            "originalNativeSha256":sha256_json(actual)})
    return {"status":"PIN_VERIFIED_NATIVE_RESEARCH", "pin":revision,
            "receipt_count":len(records),"receipts":records,
            "anti_collapse_function":analyze_collapse}


def information_loss(rows,native=None):
    # Two projections with independently stated different losses:
    # 1) budget+allocated total: hides allocation-policy differences;
    # 2) actual allocated total alone: also hides 9-vs-10 supply availability.
    states=tuple(f"{r['budget']}:{r['policy']}" for r in rows)
    rich=tuple((r["budget"],tuple(r["metrics"]["allocation"][k] for k in IDS)) for r in rows)
    middle=tuple((r["budget"],r["metrics"]["allocated_total"]) for r in rows)
    collapsed=tuple(r["metrics"]["allocated_total"] for r in rows)
    def manual_lost(target):
        pairs=[]
        for i in range(len(states)):
            for j in range(i+1,len(states)):
                if rich[i]!=rich[j] and target[i]==target[j]:
                    pairs.append((states[i],states[j]))
        return pairs
    a=manual_lost(middle)
    b=manual_lost(collapsed)
    if native and native.get("status")=="PIN_VERIFIED_NATIVE_RESEARCH":
        analyze=native["anti_collapse_function"]
        for projection,expected in ((middle,a),(collapsed,b)):
            result=analyze(states,rich,projection)
            require(result.lawful_quotient is True, "Dogram refused lawful quotient")
            require(set(result.lost_distinctions)==set(expected), "Native anti-collapse disagrees")
    return {"states":len(states), "distribution_pairs_masked_by_budget_total":len(a),
            "details_total_only_pairs_masked":len(b),
            "masked_budget_total_pairs":a,"masked_total_only_pairs":b,
            "measures":"REPRESENTATIONAL_INFORMATION_LOSS_NOT_MORAL_IMPORTANCE"}


def compile_lab(scenario,native_source=None):
    validate(scenario)
    rows=[]
    for budget in BUDGETS:
        for policy in POLICIES:
            row=pick(budget,policy)
            rows.append({"budget":budget,**row})
    native=dogram_native_optional(native_source)
    loss=information_loss(rows,native)
    comparisons=[]
    for budget in BUDGETS:
        for method in BUDGET_METHODS:
            legacy=PARENT_EXPECTATIONS[budget][method]
            exceeding=[IDS[i] for i in range(3) if legacy[i]>CAPS[i]]
            comparisons.append({"budget":budget,"method":method,
                "parent006_exact_rounding_allocation_expected":dict(zip(IDS,legacy)),
                "feasible_under_007_caps":not exceeding,
                "over_capacity_groups":exceeding,
                "note":"006 unconstrained proportional rounding is an independent comparator, not a 007 policy candidate"})
    native_payload={k:v for k,v in native.items() if k!="anti_collapse_function"}
    return {
        "schema":"unfutures.fairness-lab-007/v0",
        "environment":"SYNTHETIC_ONLY",
        "source006":scenario["source"],
        "sourceFingerprint":"sha256:"+sha256(canonical(scenario)).hexdigest(),
        "budgetCases":list(BUDGETS),
        "policies":list(POLICIES),
        "entries":rows,
        "parent006Benchmark":comparisons,
        "informationLoss":loss,
        "originalDogramWitness":native_payload,
        "review":{
            "state":"HOLD_FOR_AFFECTED_STEWARDS",
            "criteria":["actual-stock-and-capacity-evidence","consent-and-legal-eligibility",
                "legitimacy-of-editorial-goal-weights","whether-legacy-obligations-are-real",
                "selection-of-a-public-rule","review-of-zero-assignments",
                "review-of-unused-stock","individual-appeals-and-exceptions"],
            "noAutomaticPolicyChoice":True,"canCommitResources":False,
            "publicPartnerClaims":False,"physicalUnitsMoved":0,
            "whatWouldFalsifyModel":"measured actual inventory/capacity/consent differs from synthetic fixture"
        },
        "meaning":"MULTI_OBJECTIVE_TRADEOFF_MATH_NOT_FAIRNESS_OR_CAUSAL_JUDGMENT"
    }


def main():
    parser=argparse.ArgumentParser(description="UNFUTURES-007 finite synthetic allocation policies")
    parser.add_argument("--fixture",default="scenario.json")
    parser.add_argument("--native-dogram",default=None,help="original Dogram Git checkout at the exact pinned SHA")
    parser.add_argument("--output",default="report.json")
    args=parser.parse_args()
    result=compile_lab(read_scenario(args.fixture),args.native_dogram)
    Path(args.output).write_bytes(canonical(result)+b"\n")
    print(json.dumps({"budget7":{x["policy"]:x["metrics"]["allocation"]
                    for x in result["entries"] if x["budget"]==7},
        "policies":len(POLICIES),"budgets":len(BUDGETS),
        "masked_by_budget_total":result["informationLoss"]["distribution_pairs_masked_by_budget_total"],
        "masked_by_total_only":result["informationLoss"]["details_total_only_pairs_masked"],
        "nativeDogram":result["originalDogramWitness"]["status"],
        "realAllocation":0},sort_keys=True))

if __name__=="__main__":
    main()
