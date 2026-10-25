from __future__ import annotations

from collections import defaultdict
from typing import Any

from .models import ValidationResult
from .timeutil import parse_timestamp

VALID_AUTHORITIES = {"projection_only", "residue_only", "proposed", "held", "admitted", "refused"}
VALID_GATE_ROUTES = {"hold", "admit", "refuse", "pending"}


def validate_cut(obj: dict[str, Any]) -> ValidationResult:
    required = [
        "cut_id", "observer", "focus", "knowledge_horizon", "carriers",
        "decoder", "stance", "projection", "withheld", "counterpressure",
        "fog", "authority",
    ]
    errors: list[str] = []
    warnings: list[str] = []
    for key in required:
        if key not in obj:
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    try:
        horizon = parse_timestamp(obj["knowledge_horizon"], label="knowledge_horizon")
    except Exception as exc:
        errors.append(str(exc))
        horizon = None

    if obj["authority"] not in VALID_AUTHORITIES:
        errors.append(f"invalid authority {obj['authority']!r}")

    carriers = obj["carriers"]
    if not isinstance(carriers, list):
        errors.append("carriers must be a list")
    else:
        seen: set[str] = set()
        for index, carrier in enumerate(carriers):
            if not isinstance(carrier, dict):
                errors.append(f"carriers[{index}] must be an object")
                continue
            for key in ("carrier_id", "source_ref", "discovered_at", "contact"):
                if key not in carrier:
                    errors.append(f"carriers[{index}]: missing {key}")
            carrier_id = carrier.get("carrier_id")
            if carrier_id in seen:
                errors.append(f"duplicate carrier_id {carrier_id}")
            if carrier_id:
                seen.add(carrier_id)
            if carrier.get("contact") is True and not carrier.get("source_ref"):
                errors.append(f"{carrier_id}: contact requires source_ref")
            if carrier.get("discovered_at"):
                try:
                    discovered = parse_timestamp(
                        carrier["discovered_at"], label=f"{carrier_id}.discovered_at"
                    )
                    if horizon is not None and discovered > horizon:
                        errors.append(
                            f"{carrier_id}: discovered after knowledge_horizon; "
                            "move it to withheld or a descendant cut"
                        )
                except Exception as exc:
                    errors.append(str(exc))

    for key in ("withheld", "counterpressure", "fog"):
        if not isinstance(obj[key], list):
            errors.append(f"{key} must be an explicit list")
    if obj.get("projection") and not obj.get("counterpressure"):
        errors.append("projection requires explicit counterpressure")
    if obj["authority"] == "admitted" and not obj.get("gate_receipt"):
        errors.append("authority='admitted' requires gate_receipt")
    if "truth_score" in obj or "confidence_score" in obj:
        warnings.append(
            "numeric truth/confidence scoring is outside Ghost Cut authority; "
            "preserve source-specific status instead"
        )

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "cut_id": obj.get("cut_id"),
            "carrier_count": len(carriers) if isinstance(carriers, list) else 0,
        },
    )


def validate_activation(obj: dict[str, Any]) -> ValidationResult:
    required = [
        "activation_id", "old_trace", "original_contact_at", "new_trigger",
        "new_trigger_at", "new_decoder", "proposed_relation", "relation_birthday",
        "counterpressure", "gate_route", "no_retcon_note", "source_refs",
    ]
    errors: list[str] = []
    for key in required:
        if not obj.get(key):
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors)

    if obj["gate_route"] not in VALID_GATE_ROUTES:
        errors.append(f"invalid gate_route {obj['gate_route']!r}")
    try:
        original = parse_timestamp(obj["original_contact_at"], label="original_contact_at")
        trigger = parse_timestamp(obj["new_trigger_at"], label="new_trigger_at")
        relation = parse_timestamp(obj["relation_birthday"], label="relation_birthday")
        if relation < trigger:
            errors.append("relation_birthday cannot precede new_trigger_at")
        if relation < original:
            errors.append("relation_birthday cannot precede original_contact_at")
    except Exception as exc:
        errors.append(str(exc))

    if not isinstance(obj["counterpressure"], list) or not obj["counterpressure"]:
        errors.append("counterpressure must be a non-empty list")
    if not isinstance(obj["source_refs"], list) or not obj["source_refs"]:
        errors.append("source_refs must be a non-empty list")
    if len(str(obj["no_retcon_note"]).strip()) < 20:
        errors.append("no_retcon_note is too thin to establish the boundary")

    return ValidationResult.from_messages(
        errors,
        details={"activation_id": obj.get("activation_id"), "gate_route": obj.get("gate_route")},
    )


def audit_discovery(rows: list[tuple[int, dict[str, Any]]]) -> ValidationResult:
    required = ["carrier_id", "family", "carrier_kind", "source_ref", "discovered_at", "observer"]
    errors: list[str] = []
    seen: set[str] = set()
    families: dict[str, list[str]] = defaultdict(list)
    timeline: list[tuple[Any, dict[str, Any]]] = []

    for line_no, obj in rows:
        for key in required:
            if not obj.get(key):
                errors.append(f"line {line_no}: missing {key}")
        carrier_id = obj.get("carrier_id")
        if carrier_id in seen:
            errors.append(f"line {line_no}: duplicate carrier_id {carrier_id}")
        if carrier_id:
            seen.add(carrier_id)

        if "packet_discovery_at" in obj or "folder_discovery_at" in obj:
            errors.append(
                f"line {line_no}: packet/folder discovery timestamp cannot substitute "
                "for carrier discovered_at"
            )
        try:
            discovered = parse_timestamp(
                obj.get("discovered_at"), label=f"line {line_no} discovered_at"
            )
        except Exception as exc:
            errors.append(str(exc))
            continue

        families[str(obj.get("family"))].append(discovered.isoformat())
        timeline.append((discovered, obj))

    mixed = [
        {
            "family": family,
            "carrier_count": len(values),
            "distinct_discovery_times": len(set(values)),
        }
        for family, values in sorted(families.items())
        if len(set(values)) > 1
    ]
    timeline.sort(key=lambda item: item[0])
    serial = [
        {
            "discovered_at": dt.isoformat().replace("+00:00", "Z"),
            "carrier_id": obj.get("carrier_id"),
            "family": obj.get("family"),
            "kind": obj.get("carrier_kind"),
        }
        for dt, obj in timeline
    ]

    return ValidationResult.from_messages(
        errors,
        details={
            "entry_count": len(timeline),
            "mixed_discovery_families": mixed,
            "timeline": serial,
        },
    )


def observer_delta(old: dict[str, Any], new: dict[str, Any]) -> dict[str, Any]:
    old_carriers = {x["carrier_id"] for x in old.get("carriers", []) if "carrier_id" in x}
    new_carriers = {x["carrier_id"] for x in new.get("carriers", []) if "carrier_id" in x}
    return {
        "observer": new.get("observer"),
        "from_cut": old.get("cut_id"),
        "to_cut": new.get("cut_id"),
        "newly_available_or_contacted": sorted(new_carriers - old_carriers),
        "no_longer_in_cut": sorted(old_carriers - new_carriers),
        "stance_before": old.get("stance"),
        "stance_after": new.get("stance"),
        "projection_before": old.get("projection"),
        "projection_after": new.get("projection"),
        "fog_added": [x for x in new.get("fog", []) if x not in old.get("fog", [])],
        "fog_removed": [x for x in old.get("fog", []) if x not in new.get("fog", [])],
        "law": (
            "CHANGE OF STANCE IS AN ATTRIBUTABLE OCCURRENCE; "
            "DELTA != RETROACTIVE KNOWLEDGE"
        ),
    }
