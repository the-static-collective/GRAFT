from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from .io import load_json, load_ndjson
from .models import ValidationResult

REQUIRED_SEED_FILES = {
    "interaction-cycles.ndjson": ["cycle_id", "status", "steps", "hypothesis", "counterevidence", "unknowns"],
    "pressure-edges.ndjson": ["edge_id", "from_actor", "to_actor", "desired_movement", "lever_types", "classification", "refusal_cost"],
    "personhood-collisions.ndjson": ["collision_id", "person", "person_need_or_choice", "role_expectation", "translation", "source_refs"],
    "principle-consistency.ndjson": ["test_id", "actor", "principle", "principle_source", "applications", "assessment", "mirror_question"],
}

KEY_PATTERNS = {
    "role": re.compile(r"\b(husband|wife|father|mother|family|partner|protect|provide|lead|commit|choose)\b", re.I),
    "distance": re.compile(r"\b(leave|left|stay|come home|come back|space|peace|sleep|alone|far away)\b", re.I),
    "safety_identity": re.compile(r"\b(safe|safety|danger|risk|selfish|love yourself|abandon|betray|trust)\b", re.I),
    "authority_resource": re.compile(r"\b(police|911|court|host|car|ride|allowed to see|report|shelter)\b", re.I),
    "pressure_form": re.compile(r"\b(if you|unless|must|need you|have to|or i will|or else|choose me)\b", re.I),
}


def validate_decoder(root: str | Path) -> ValidationResult:
    root = Path(root)
    seed = root / "seed"
    errors: list[str] = []
    counts: dict[str, int] = {}

    for filename, fields in REQUIRED_SEED_FILES.items():
        path = seed / filename
        if not path.exists():
            errors.append(f"missing seed file {filename}")
            counts[filename] = 0
            continue
        rows = load_ndjson(path)
        counts[filename] = len(rows)
        for line_no, obj in rows:
            for field in fields:
                if field not in obj:
                    errors.append(f"{filename}:{line_no}: missing {field}")

    anchors_path = seed / "source-anchors.json"
    anchors = load_json(anchors_path) if anchors_path.exists() else {}
    if not anchors_path.exists():
        errors.append("missing seed file source-anchors.json")
    for name, anchor in anchors.items():
        for field in ["source_path", "source_line", "sms_id", "timestamp_local", "direction", "body"]:
            if not anchor.get(field):
                errors.append(f"anchor {name}: missing {field}")

    return ValidationResult.from_messages(
        errors,
        details={"counts": counts, "anchor_count": len(anchors)},
    )


def candidate_windows(
    rows: list[tuple[int, dict[str, Any]]],
    *,
    identifiers: set[str],
    context: int = 2,
) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for line_no, row in rows:
        if identifiers and row.get("address") not in identifiers:
            continue
        body = row.get("body") or ""
        tags = [name for name, pattern in KEY_PATTERNS.items() if pattern.search(body)]
        filtered.append(
            {
                "line": line_no,
                "id": row.get("_id"),
                "date": row.get("date"),
                "type": row.get("type"),
                "body": body,
                "tags": tags,
            }
        )

    candidates: list[dict[str, Any]] = []
    for index, row in enumerate(filtered):
        if len(row["tags"]) >= 2 or (
            "authority_resource" in row["tags"] and "pressure_form" in row["tags"]
        ):
            lo = max(0, index - context)
            hi = min(len(filtered), index + context + 1)
            candidates.append(
                {
                    "anchor": row,
                    "context": filtered[lo:hi],
                    "warning": (
                        "HEURISTIC REVIEW CANDIDATE — lexical tags are not conclusions."
                    ),
                }
            )
    return candidates


def render_decoder_report(root: str | Path) -> str:
    root = Path(root)
    seed = root / "seed"

    def load(name):
        return [obj for _, obj in load_ndjson(seed / name)]

    cycles = load("interaction-cycles.ndjson")
    pressure = load("pressure-edges.ndjson")
    collisions = load("personhood-collisions.ndjson")
    consistency = load("principle-consistency.ndjson")

    out = [
        "# DECODER — SEED REPORT",
        "",
        "**This is a hand-receipted seed, not a frequency estimate for a relationship.**",
        "",
        "## Interaction cycles",
    ]
    for item in cycles:
        out += [
            f"### {item['cycle_id']}",
            f"Status: `{item['status']}`",
            "",
            item["hypothesis"],
            "",
        ]
        for step in item["steps"]:
            out.append(
                f"{step['ordinal']}. **{step['actor']} / {step['kind']}** — "
                f"{step['summary']}"
            )
        out += [
            "",
            "**Counterevidence / brakes:** " + " | ".join(item["counterevidence"]),
            "",
        ]

    out += ["## Pressure direction"]
    for item in pressure:
        out += [
            f"- **{item['from_actor']} → {item['to_actor']}** "
            f"(`{item['classification']}`): {item['desired_movement']}  ",
            f"  Levers: {', '.join(item['lever_types'])}. "
            f"Refusal cost: {'; '.join(item['refusal_cost'])}",
        ]

    out += ["", "## Personhood collisions"]
    for item in collisions:
        out += [
            f"- **{item['collision_id']}** — person choice/need: "
            f"{item['person_need_or_choice']}  ",
            f"  Role expectation: {item['role_expectation']}  ",
            f"  Translation: {item['translation']}",
        ]

    out += ["", "## Principle / consistency tests"]
    for item in consistency:
        out += [
            f"- **{item['test_id']}** — `{item['assessment']}` — "
            f"{item['principle']}  ",
            f"  Mirror: {item['mirror_question']}",
        ]
    return "\n".join(out) + "\n"
