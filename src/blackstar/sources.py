from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from .models import ValidationResult

ALLOWED_REPRESENTATIONS = {
    "embedded_raw",
    "embedded_derived",
    "embedded_export",
    "pointer_only",
}


def validate_index(index: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    if index.get("schema") != "black-star-git-source-index-v1":
        errors.append("unexpected index schema")

    counts = index.get("counts", {})
    represented = sum(
        int(counts.get(key, 0))
        for key in ("embedded_raw", "embedded_derived", "embedded_export", "pointer_only")
    )
    if represented != counts.get("entries"):
        errors.append("representation counts do not sum to entries")
    if counts.get("police_raw_pages") != 31:
        errors.append("police_raw_pages must be 31 for snapshot 45")

    release = index.get("sealed_release", {})
    if not release.get("zip_sha256"):
        errors.append("sealed release missing zip_sha256")
    if len(release.get("drive_parts", [])) != 2:
        errors.append("sealed release must identify two Drive parts")
    if len(index.get("pointer_only", [])) != counts.get("pointer_only"):
        errors.append("pointer-only index count mismatch")

    return ValidationResult.from_messages(
        errors,
        details={"snapshot": index.get("snapshot"), "counts": counts},
    )


def validate_full_registry(registry: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    entries = registry.get("entries")
    if not isinstance(entries, list):
        return ValidationResult.from_messages(["entries must be a list"])

    seen: set[str] = set()
    for i, entry in enumerate(entries, 1):
        source_id = entry.get("source_id")
        if not source_id:
            errors.append(f"entry {i}: missing source_id")
        elif source_id in seen:
            errors.append(f"entry {i}: duplicate source_id {source_id}")
        else:
            seen.add(source_id)

        representation = entry.get("representation")
        if representation not in ALLOWED_REPRESENTATIONS:
            errors.append(f"{source_id or i}: unknown representation {representation!r}")
        if not entry.get("source_class"):
            errors.append(f"{source_id or i}: missing source_class")
        if not entry.get("drive_id"):
            errors.append(f"{source_id or i}: missing drive_id")

        if representation == "pointer_only":
            if entry.get("local_path") is not None:
                errors.append(f"{source_id or i}: pointer_only must not have local_path")
        else:
            if not entry.get("local_path"):
                errors.append(f"{source_id or i}: embedded representation missing local_path")
            if not entry.get("sha256"):
                errors.append(f"{source_id or i}: embedded representation missing sha256")
            if not isinstance(entry.get("size_bytes"), int):
                errors.append(
                    f"{source_id or i}: embedded representation missing integer size_bytes"
                )

    page_numbers = sorted(
        int(entry["source_id"].split("-")[-1])
        for entry in entries
        if str(entry.get("source_id", "")).startswith("police-page-")
    )
    if page_numbers != list(range(1, 32)):
        errors.append(f"police page coverage wrong: {page_numbers}")

    return ValidationResult.from_messages(errors, details={"entry_count": len(entries)})


def verify_vault_bytes(registry: dict[str, Any], vault: str | Path) -> ValidationResult:
    errors: list[str] = []
    checked = 0
    root = Path(vault)

    for entry in registry.get("entries", []):
        representation = str(entry.get("representation", ""))
        if not representation.startswith("embedded_"):
            continue
        rel = entry.get("local_path")
        if not rel:
            continue

        checked += 1
        path = root / rel
        if not path.exists():
            errors.append(f"{entry.get('source_id')}: missing {rel}")
            continue
        if path.stat().st_size != entry.get("size_bytes"):
            errors.append(f"{entry.get('source_id')}: size mismatch")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != entry.get("sha256"):
            errors.append(f"{entry.get('source_id')}: sha mismatch")

    return ValidationResult.from_messages(errors, details={"checked": checked})
