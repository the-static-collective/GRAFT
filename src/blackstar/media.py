from __future__ import annotations

import re
from typing import Any

from .models import ValidationResult
from .timeutil import parse_timestamp

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
CONTACT_SCOPES = {"full_bytes", "streamed_full", "partial_range", "metadata_only"}
DERIVATIVE_RELATIONS = {
    "transcription",
    "scene_analysis",
    "frame_extract",
    "proxy",
    "summary",
    "annotation",
}
DERIVATIVE_AUTHORITIES = {"derived_only", "analysis_aid"}
OBSERVATION_MODALITIES = {"visual", "audio", "audiovisual"}
OBSERVATION_LAYERS = {
    "direct_record",
    "original_utterance",
    "speaker_claim",
    "interpretation",
}
ATTACHMENT_KINDS = {
    "lexical_clarification",
    "object_identification",
    "contextual_note",
    "correction",
    "later_recollection",
}


def _valid_sha256(value: Any) -> bool:
    return isinstance(value, str) and SHA256_RE.fullmatch(value.lower()) is not None


def validate_contact_receipt(obj: dict[str, Any]) -> ValidationResult:
    required = [
        "receipt_id",
        "carrier_id",
        "source_ref",
        "discovered_at",
        "contacted_at",
        "source_class",
        "contact_scope",
        "sha256",
        "size_bytes",
    ]
    errors: list[str] = []
    warnings: list[str] = []
    for key in required:
        if key not in obj or obj.get(key) in (None, ""):
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    try:
        discovered = parse_timestamp(obj["discovered_at"], label="discovered_at")
        contacted = parse_timestamp(obj["contacted_at"], label="contacted_at")
        if contacted < discovered:
            errors.append("contacted_at cannot precede discovered_at")
    except Exception as exc:
        errors.append(str(exc))

    scope = obj["contact_scope"]
    if scope not in CONTACT_SCOPES:
        errors.append(f"invalid contact_scope {scope!r}")
    if not _valid_sha256(obj["sha256"]):
        errors.append("sha256 must be a 64-character lowercase hexadecimal digest")
    if not isinstance(obj["size_bytes"], int) or obj["size_bytes"] <= 0:
        errors.append("size_bytes must be a positive integer")
    if scope == "partial_range":
        ranges = obj.get("byte_ranges")
        if not isinstance(ranges, list) or not ranges:
            errors.append("partial_range contact requires byte_ranges")
    elif obj.get("byte_ranges"):
        warnings.append("byte_ranges supplied for non-partial contact scope")
    if scope == "metadata_only":
        warnings.append(
            "metadata_only contact does not establish audiovisual/content contact"
        )
    duration = obj.get("duration_seconds")
    if duration is not None and (
        not isinstance(duration, (int, float)) or duration <= 0
    ):
        errors.append("duration_seconds must be positive when present")

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "receipt_id": obj.get("receipt_id"),
            "carrier_id": obj.get("carrier_id"),
            "law": "CONTACT != DISCOVERY",
        },
    )


def validate_artifact_lineage(obj: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    for key in ("lineage_id", "root_artifact", "derivatives"):
        if key not in obj:
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    root = obj["root_artifact"]
    if not isinstance(root, dict):
        return ValidationResult.from_messages(["root_artifact must be an object"])
    for key in ("artifact_id", "artifact_kind", "source_ref"):
        if not root.get(key):
            errors.append(f"root_artifact missing {key}")
    if root.get("sha256") is not None and not _valid_sha256(root.get("sha256")):
        errors.append(
            "root_artifact sha256 must be a 64-character hexadecimal digest"
        )

    derivatives = obj["derivatives"]
    if not isinstance(derivatives, list):
        return ValidationResult.from_messages(
            errors + ["derivatives must be a list"], warnings
        )

    root_id = root.get("artifact_id")
    ids = {root_id} if root_id else set()
    for index, item in enumerate(derivatives):
        prefix = f"derivatives[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue
        for key in (
            "artifact_id",
            "artifact_kind",
            "parent_artifact_id",
            "relation",
            "produced_at",
            "generator",
            "authority",
        ):
            if not item.get(key):
                errors.append(f"{prefix}: missing {key}")
        artifact_id = item.get("artifact_id")
        if artifact_id in ids:
            errors.append(f"{prefix}: duplicate artifact_id {artifact_id}")
        if artifact_id:
            ids.add(artifact_id)
        relation = item.get("relation")
        if relation not in DERIVATIVE_RELATIONS:
            errors.append(f"{prefix}: invalid relation {relation!r}")
        if item.get("authority") not in DERIVATIVE_AUTHORITIES:
            errors.append(
                f"{prefix}: invalid authority {item.get('authority')!r}"
            )
        try:
            parse_timestamp(
                item.get("produced_at"), label=f"{prefix}.produced_at"
            )
        except Exception as exc:
            errors.append(str(exc))
        if item.get("independent") is True or item.get("independence_basis"):
            errors.append(
                f"{prefix}: a derivative of this root cannot be marked independent evidence"
            )
        digest = item.get("sha256")
        if digest is not None and not _valid_sha256(digest):
            errors.append(
                f"{prefix}: sha256 must be a 64-character hexadecimal digest"
            )

    all_ids = {root_id} | {
        item.get("artifact_id")
        for item in derivatives
        if isinstance(item, dict) and item.get("artifact_id")
    }
    parent_map: dict[str, str] = {}
    for index, item in enumerate(derivatives):
        if not isinstance(item, dict):
            continue
        artifact_id = item.get("artifact_id")
        parent = item.get("parent_artifact_id")
        if parent and parent not in all_ids:
            errors.append(
                f"derivatives[{index}]: unknown parent_artifact_id {parent}"
            )
        if parent and parent == artifact_id:
            errors.append(
                f"derivatives[{index}]: artifact cannot derive from itself"
            )
        if artifact_id and parent:
            parent_map[str(artifact_id)] = str(parent)

    for artifact_id in parent_map:
        seen_chain: set[str] = set()
        current = artifact_id
        while current in parent_map:
            if current in seen_chain:
                errors.append(
                    f"artifact lineage cycle detected at {current}"
                )
                break
            seen_chain.add(current)
            current = parent_map[current]

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "lineage_id": obj.get("lineage_id"),
            "derivative_count": len(derivatives),
            "independent_evidence_count": 0,
            "law": "DERIVED VIEW != INDEPENDENT WITNESS",
        },
    )


def validate_media_observations(
    rows: list[tuple[int, dict[str, Any]]],
) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    seen: set[str] = set()

    for line_no, obj in rows:
        prefix = f"line {line_no}"
        for key in (
            "observation_id",
            "carrier_id",
            "start_seconds",
            "end_seconds",
            "modality",
            "layer",
            "observation",
            "source_ref",
        ):
            if key not in obj or obj.get(key) in (None, ""):
                errors.append(f"{prefix}: missing {key}")
        oid = obj.get("observation_id")
        if oid in seen:
            errors.append(f"{prefix}: duplicate observation_id {oid}")
        if oid:
            seen.add(str(oid))
        start, end = obj.get("start_seconds"), obj.get("end_seconds")
        if not isinstance(start, (int, float)) or start < 0:
            errors.append(f"{prefix}: start_seconds must be non-negative")
        if not isinstance(end, (int, float)) or end < 0:
            errors.append(f"{prefix}: end_seconds must be non-negative")
        if (
            isinstance(start, (int, float))
            and isinstance(end, (int, float))
            and end < start
        ):
            errors.append(
                f"{prefix}: end_seconds cannot precede start_seconds"
            )
        if obj.get("modality") not in OBSERVATION_MODALITIES:
            errors.append(
                f"{prefix}: invalid modality {obj.get('modality')!r}"
            )
        if obj.get("layer") not in OBSERVATION_LAYERS:
            errors.append(f"{prefix}: invalid layer {obj.get('layer')!r}")
        if obj.get("layer") in {
            "original_utterance",
            "speaker_claim",
            "interpretation",
        }:
            if not obj.get("attributable_to"):
                errors.append(
                    f"{prefix}: {obj.get('layer')} requires attributable_to"
                )
        if obj.get("layer") == "direct_record" and obj.get("attributable_to"):
            warnings.append(
                f"{prefix}: direct_record has attributable_to; ensure this is not silently a speaker claim"
            )

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "observation_count": len(rows),
            "law": "TIMECODED OBSERVATION != CAUSAL VERDICT",
        },
    )


def validate_proxy_receipt(obj: dict[str, Any]) -> ValidationResult:
    required = [
        "transform_id",
        "source_artifact_id",
        "source_sha256",
        "output_artifact_id",
        "output_sha256",
        "operation",
        "created_at",
        "source_duration_seconds",
        "output_duration_seconds",
        "authority_source_artifact_id",
    ]
    errors: list[str] = []
    warnings: list[str] = []
    for key in required:
        if key not in obj or obj.get(key) in (None, ""):
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    if not _valid_sha256(obj["source_sha256"]):
        errors.append(
            "source_sha256 must be a 64-character hexadecimal digest"
        )
    if not _valid_sha256(obj["output_sha256"]):
        errors.append(
            "output_sha256 must be a 64-character hexadecimal digest"
        )
    if obj["source_sha256"] == obj["output_sha256"]:
        warnings.append(
            "source and output hashes are identical; confirm a transform occurred"
        )
    if obj["authority_source_artifact_id"] != obj["source_artifact_id"]:
        errors.append(
            "authority_source_artifact_id must identify the original source artifact"
        )
    try:
        parse_timestamp(obj["created_at"], label="created_at")
    except Exception as exc:
        errors.append(str(exc))

    source_duration = obj["source_duration_seconds"]
    output_duration = obj["output_duration_seconds"]
    if not isinstance(source_duration, (int, float)) or source_duration <= 0:
        errors.append("source_duration_seconds must be positive")
    if not isinstance(output_duration, (int, float)) or output_duration <= 0:
        errors.append("output_duration_seconds must be positive")
    if (
        isinstance(source_duration, (int, float))
        and isinstance(output_duration, (int, float))
        and source_duration > 0
        and output_duration > 0
    ):
        tolerance = obj.get("duration_tolerance_seconds", 0.5)
        if not isinstance(tolerance, (int, float)) or tolerance < 0:
            errors.append("duration_tolerance_seconds must be non-negative")
        elif abs(source_duration - output_duration) > tolerance:
            errors.append(
                f"proxy duration drift {abs(source_duration - output_duration):.3f}s "
                f"exceeds tolerance {tolerance:.3f}s"
            )

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "transform_id": obj.get("transform_id"),
            "law": "PROXY != ORIGINAL",
        },
    )


def validate_interpretive_attachment(
    obj: dict[str, Any],
) -> ValidationResult:
    required = [
        "attachment_id",
        "kind",
        "target",
        "context_source_ref",
        "context_discovered_at",
        "attached_at",
        "relation_birthday",
        "statement",
        "no_retcon_note",
    ]
    errors: list[str] = []
    warnings: list[str] = []
    for key in required:
        if key not in obj or obj.get(key) in (None, ""):
            errors.append(f"missing required field {key}")
    if errors:
        return ValidationResult.from_messages(errors, warnings)

    if obj["kind"] not in ATTACHMENT_KINDS:
        errors.append(f"invalid attachment kind {obj['kind']!r}")
    target = obj["target"]
    if not isinstance(target, dict):
        errors.append("target must be an object")
    else:
        for key in ("carrier_id", "start_seconds", "end_seconds"):
            if key not in target:
                errors.append(f"target missing {key}")
        start, end = target.get("start_seconds"), target.get("end_seconds")
        if not isinstance(start, (int, float)) or start < 0:
            errors.append("target.start_seconds must be non-negative")
        if not isinstance(end, (int, float)) or end < 0:
            errors.append("target.end_seconds must be non-negative")
        if (
            isinstance(start, (int, float))
            and isinstance(end, (int, float))
            and end < start
        ):
            errors.append(
                "target.end_seconds cannot precede target.start_seconds"
            )

    try:
        discovered = parse_timestamp(
            obj["context_discovered_at"],
            label="context_discovered_at",
        )
        attached = parse_timestamp(obj["attached_at"], label="attached_at")
        relation = parse_timestamp(
            obj["relation_birthday"], label="relation_birthday"
        )
        if attached < discovered:
            errors.append(
                "attached_at cannot precede context_discovered_at"
            )
        if relation < discovered:
            errors.append(
                "relation_birthday cannot precede context_discovered_at"
            )
    except Exception as exc:
        errors.append(str(exc))

    if len(str(obj["no_retcon_note"]).strip()) < 20:
        errors.append(
            "no_retcon_note is too thin to establish the boundary"
        )
    if obj.get("rewrite_source") is True:
        errors.append(
            "interpretive attachment cannot rewrite the source carrier"
        )

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "attachment_id": obj.get("attachment_id"),
            "kind": obj.get("kind"),
            "law": "LATER CONTEXT != SOURCE CONTENT",
        },
    )
