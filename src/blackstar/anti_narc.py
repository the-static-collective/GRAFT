from __future__ import annotations

import json
import re
from typing import Any

from .models import ValidationResult

VALID_LAYERS = {"source_fact", "event_claim", "interpretation", "institutional_action"}
VALID_DIRECTNESS = {"original_utterance", "direct_record", "contemporaneous_report", "retrospective_report", "derived_interpretation"}
VALID_STATES = {"source_fact_only", "unresolved", "disputed", "partially_corroborated", "corroborated", "contradicted", "mixed"}
REACH_ORDER = ["private", "dyadic", "family", "social", "professional", "service", "police", "legal", "public"]
PROMOTIONS = {
    ("unresolved", "partially_corroborated"),
    ("disputed", "partially_corroborated"),
    ("unresolved", "corroborated"),
    ("disputed", "corroborated"),
    ("partially_corroborated", "corroborated"),
    ("mixed", "partially_corroborated"),
    ("mixed", "corroborated"),
}


def lint_claim(obj: dict[str, Any], line_no: int = 1) -> list[str]:
    out: list[str] = []
    claim_id = obj.get("claim_id", f"line-{line_no}")

    def err(message: str) -> None:
        out.append(f"{claim_id}: {message}")

    for key in ("claim_id", "proposition", "claimant", "layer", "directness", "epistemic_state", "source_refs", "reach_level"):
        if not obj.get(key):
            err(f"missing required field {key}")
    if obj.get("layer") not in VALID_LAYERS:
        err("invalid layer")
    if obj.get("directness") not in VALID_DIRECTNESS:
        err("invalid directness")
    if obj.get("epistemic_state") not in VALID_STATES:
        err("invalid epistemic_state")
    if obj.get("reach_level") not in REACH_ORDER:
        err("invalid reach_level")
    if not isinstance(obj.get("source_refs"), list) or not obj.get("source_refs"):
        err("source_refs must contain at least one receipt")
    if obj.get("layer") == "interpretation" and obj.get("epistemic_state") == "corroborated":
        err("interpretation cannot become 'corroborated' merely as an interpretation; corroborate its component propositions instead")
    if obj.get("directness") in {"contemporaneous_report", "retrospective_report"} and obj.get("original_utterance_available") is False:
        if "quote" in obj or obj.get("verbatim") is True:
            err("report-of-utterance cannot be promoted to an original verbatim utterance")
    if obj.get("epistemic_state") == "disputed" and not (obj.get("dispute_refs") or obj.get("notes")):
        err("disputed claim should carry dispute_refs or an explicit dispute note")
    if obj.get("diagnostic_claim") and obj.get("directness") == "derived_interpretation":
        err("derived pattern matching must not be promoted to clinical diagnosis")
    if obj.get("reach_level") in {"service", "police", "legal", "public"} and obj.get("epistemic_state") == "corroborated" and not obj.get("independent_evidence_refs"):
        err("high reach is not corroboration; add independent_evidence_refs or lower epistemic status")
    return out


def lint_claims(rows: list[tuple[int, dict[str, Any]]]) -> ValidationResult:
    errors: list[str] = []
    for line_no, obj in rows:
        errors.extend(lint_claim(obj, line_no))
    return ValidationResult.from_messages(errors, details={"claim_count": len(rows)})


def audit_status_deltas(rows: list[tuple[int, dict[str, Any]]]) -> ValidationResult:
    errors: list[str] = []
    for line_no, obj in rows:
        delta_id = obj.get("delta_id", f"line-{line_no}")
        old, new = obj.get("from_state"), obj.get("to_state")
        evidence = obj.get("new_evidence_refs") or []
        independence = obj.get("independence_assessment")
        if (old, new) in PROMOTIONS:
            if not evidence:
                errors.append(f"{delta_id}: epistemic promotion without new_evidence_refs")
            if independence not in {"partly_independent", "independent"}:
                errors.append(f"{delta_id}: promotion requires partly_independent or independent evidence; got {independence}")
            if obj.get("authority_change_only"):
                errors.append(f"{delta_id}: authority/reach change cannot itself promote epistemic status")
    return ValidationResult.from_messages(errors, details={"delta_count": len(rows)})


def lint_mirrors(rows: list[tuple[int, dict[str, Any]]]) -> ValidationResult:
    errors: list[str] = []
    for line_no, obj in rows:
        mirror_id = obj.get("mirror_test_id", f"line-{line_no}")
        status = obj.get("symmetry_status")
        class_a = (obj.get("case_a") or {}).get("classification")
        class_b = (obj.get("case_b") or {}).get("classification")
        if status == "different_rule_explained" and not (obj.get("asymmetry_explanation") and obj.get("asymmetry_evidence_refs")):
            errors.append(f"{mirror_id}: different rule requires explanation + evidence refs")
        if class_a != class_b and status == "same_rule":
            errors.append(f"{mirror_id}: classifications differ but symmetry_status says same_rule")
        if status == "possible_double_standard" and not obj.get("asymmetry_evidence_refs"):
            errors.append(f"{mirror_id}: possible double standard must cite the compared receipts")
    return ValidationResult.from_messages(errors, details={"mirror_count": len(rows)})


def trace_lineage(obj: dict[str, Any]) -> ValidationResult:
    lineage_id = obj.get("lineage_id", "(unnamed)")
    members = obj.get("members", [])
    errors: list[str] = []
    roots: list[str] = []
    independent: list[str] = []
    echoes: list[str] = []
    for member in members:
        relation = member.get("relation_to_root")
        origin = member.get("knowledge_origin")
        if relation == "root":
            roots.append(member.get("claim_id"))
        if relation == "independent_evidence":
            if origin != "independent_observation" or not member.get("independence_basis"):
                errors.append(f"{member.get('claim_id')}: independent_evidence lacks independent_observation + independence_basis")
            else:
                independent.append(member.get("claim_id"))
        if relation in {"duplicate", "retelling", "summary", "institutional_record"} and origin == "root_assertion":
            echoes.append(member.get("claim_id"))
        if relation in {"duplicate", "retelling", "summary", "institutional_record"} and member.get("independence_basis"):
            errors.append(f"{member.get('claim_id')}: downstream echo carries independence_basis; verify it is truly independent")
    if len(roots) != 1:
        errors.append(f"expected exactly one root member, found {len(roots)}")
    return ValidationResult.from_messages(
        errors,
        details={
            "lineage_id": lineage_id,
            "members": len(members),
            "echoes_same_knowledge": echoes,
            "independent_evidence": independent,
            "law": "DOCUMENT COUNT != SOURCE COUNT",
        },
    )



def validate_event_packet(packet: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    for key in (
        "event_id",
        "time_window",
        "source_facts",
        "claims",
        "interpretations",
        "unknowns",
        "authority_effects",
    ):
        if key not in packet:
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    window = packet["time_window"]
    if not isinstance(window, dict):
        errors.append("time_window must be an object")
    else:
        for key in ("start", "end", "timezone"):
            if not window.get(key):
                errors.append(f"time_window missing {key}")
        if window.get("start") and window.get("end"):
            from .timeutil import parse_timestamp
            try:
                start = parse_timestamp(
                    window["start"], label="time_window.start"
                )
                end = parse_timestamp(
                    window["end"], label="time_window.end"
                )
                if end < start:
                    errors.append(
                        "time_window.end cannot precede time_window.start"
                    )
            except Exception as exc:
                errors.append(str(exc))

    source_facts = packet["source_facts"]
    if not isinstance(source_facts, list):
        errors.append("source_facts must be a list")
        source_facts = []
    for index, item in enumerate(source_facts):
        prefix = f"source_facts[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue
        if not item.get("fact"):
            errors.append(f"{prefix}: missing fact")
        if not isinstance(item.get("source_refs"), list) or not item.get(
            "source_refs"
        ):
            errors.append(
                f"{prefix}: source_refs must be a non-empty list"
            )
        if item.get("claimant") or item.get("status"):
            warnings.append(
                f"{prefix}: source fact contains claim/status fields; "
                "confirm it is not an attributable claim"
            )

    claims = packet["claims"]
    if not isinstance(claims, list):
        errors.append("claims must be a list")
        claims = []
    for index, item in enumerate(claims):
        prefix = f"claims[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue
        for key in ("claimant", "proposition", "status", "source_refs"):
            if not item.get(key):
                errors.append(f"{prefix}: missing {key}")
        if item.get("status") not in VALID_STATES:
            errors.append(
                f"{prefix}: invalid status {item.get('status')!r}"
            )
        if not isinstance(item.get("source_refs"), list) or not item.get(
            "source_refs"
        ):
            errors.append(
                f"{prefix}: source_refs must be a non-empty list"
            )
        if item.get("status") in {
            "partially_corroborated",
            "corroborated",
        } and not item.get("independent_evidence_refs"):
            errors.append(
                f"{prefix}: corroborated status requires "
                "independent_evidence_refs"
            )

    interpretations = packet["interpretations"]
    if not isinstance(interpretations, list):
        errors.append("interpretations must be a list")
        interpretations = []
    for index, item in enumerate(interpretations):
        prefix = f"interpretations[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue
        for key in ("interpreter", "interpretation", "source_refs"):
            if not item.get(key):
                errors.append(f"{prefix}: missing {key}")
        if not isinstance(item.get("source_refs"), list) or not item.get(
            "source_refs"
        ):
            errors.append(
                f"{prefix}: source_refs must be a non-empty list"
            )
        if item.get("status") == "corroborated":
            errors.append(
                f"{prefix}: interpretation cannot be marked corroborated "
                "as an interpretation"
            )

    if not isinstance(packet["unknowns"], list):
        errors.append("unknowns must be a list")
    if not isinstance(packet["authority_effects"], list):
        errors.append("authority_effects must be a list")

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "event_id": packet.get("event_id"),
            "source_fact_count": len(source_facts),
            "claim_count": len(claims),
            "interpretation_count": len(interpretations),
            "law": "PACKET != CUT",
        },
    )

def render_event_packet(packet: dict[str, Any]) -> str:
    out = [f"# Event packet — {packet['event_id']}"]
    window = packet["time_window"]
    out += ["", f"Time: {window.get('start')} → {window.get('end')} ({window.get('timezone')})"]
    if packet.get("place"):
        out += ["", f"Place: {packet['place']}"]
    out += ["", "## Source facts"]
    out += [f"- {x['fact']} — receipts: {', '.join(x['source_refs'])}" for x in packet.get("source_facts", [])]
    out += ["", "## Attributable claims"]
    out += [f"- **{x['claimant']}**: {x['proposition']} [{x.get('status', 'unresolved')}] — {', '.join(x['source_refs'])}" for x in packet.get("claims", [])]
    if packet.get("interpretations"):
        out += ["", "## Interpretations"]
        out += [f"- **{x['interpreter']}**: {x['interpretation']} — {', '.join(x['source_refs'])}" for x in packet["interpretations"]]
    out += ["", "## Unknowns"]
    out += [f"- {x}" for x in packet.get("unknowns", [])]
    out += ["", "## Authority effects"]
    out += [f"- {json.dumps(x, ensure_ascii=False)}" for x in packet.get("authority_effects", [])]
    return "\n".join(out) + "\n"


def render_authority_map(mapping: dict[str, Any]) -> str:
    def safe(value: str) -> str:
        return re.sub(r"[^A-Za-z0-9_]", "_", value)

    out = ["flowchart LR"]
    for node in mapping.get("nodes", []):
        node_id = safe(node["node_id"])
        label = f"{node['surface']}\\nreach={node['reach_level']}\\nevidence={node['epistemic_delta']}"
        if node.get("authority_effect"):
            label += f"\\neffect={node['authority_effect']}"
        out.append(f'  {node_id}["{label}"]')
    for edge in mapping.get("edges", []):
        out.append(f"  {safe(edge['from'])} -->|{edge['relation']}| {safe(edge['to'])}")
    return "\n".join(out) + "\n"
