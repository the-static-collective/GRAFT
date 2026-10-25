from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

from .query import (
    iter_window_messages,
    latest_export_id,
    search_messages,
)
from .schema import hash_file


def bomb_run(
    db,
    store: Path,
    plan_path: Path,
    *,
    out: Path | None = None,
    export_id: int | None = None,
) -> dict:
    plan = json.loads(
        plan_path.read_text(encoding="utf-8")
    )
    if not isinstance(plan, dict):
        raise ValueError(
            "bomb-run plan must be a JSON object"
        )

    export_id = export_id or latest_export_id(db)
    tz = str(plan.get("timezone") or "UTC")
    roles = [
        str(x)
        for x in (
            plan.get("roles")
            or ["user", "assistant"]
        )
    ]
    context = int(plan.get("context", 2))
    name = str(
        plan.get("name") or plan_path.stem
    )
    slug = (
        re.sub(
            r"[^a-z0-9]+",
            "-",
            name.casefold(),
        ).strip("-")
        or "bomb-run"
    )
    out = out or (
        store
        / "bomb-runs"
        / (
            datetime.now().strftime("%Y%m%d-%H%M%S")
            + "-"
            + slug
        )
    )
    out.mkdir(
        parents=True,
        exist_ok=False,
    )

    index = []
    emitted = 0
    window_hits = 0
    global_hits = 0
    with (
        (out / "messages.ndjson").open(
            "w",
            encoding="utf-8",
        ) as messages,
        (out / "phrase-hits.ndjson").open(
            "w",
            encoding="utf-8",
        ) as hits,
    ):
        for raw in plan.get("windows") or []:
            if not isinstance(raw, dict):
                continue
            wid = str(
                raw.get("id")
                or f"window-{len(index)+1}"
            )
            terms = [
                str(x)
                for x in (
                    raw.get("terms") or []
                )
            ]
            count = 0
            hit_count = 0
            conversations = set()
            for row in iter_window_messages(
                db,
                export_id,
                str(raw["from"]),
                str(raw["to"]),
                tz,
                roles,
            ):
                folded = row["text"].casefold()
                matched = [
                    term
                    for term in terms
                    if term.casefold() in folded
                ]
                messages.write(
                    json.dumps(
                        {
                            "window_id": wid,
                            "matched_terms": matched,
                            **row,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                count += 1
                emitted += 1
                hit_count += len(matched)
                window_hits += len(matched)
                conversations.add(
                    row["conversation_id"]
                )
            index.append(
                {
                    "window_id": wid,
                    "from": str(raw["from"]),
                    "to": str(raw["to"]),
                    "messages": count,
                    "conversations": len(
                        conversations
                    ),
                    "term_hits": hit_count,
                    "terms": terms,
                }
            )

        for term in plan.get("global_terms") or []:
            for hit in search_messages(
                db,
                str(term),
                export_id=export_id,
                context=context,
                limit=int(
                    plan.get(
                        "global_limit",
                        500,
                    )
                ),
            ):
                hits.write(
                    json.dumps(
                        {
                            "term": str(term),
                            **hit,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                global_hits += 1

    result = {
        "schema": (
            "black-star-chat-archive-"
            "bomb-run-v1"
        ),
        "name": name,
        "plan_path": str(plan_path),
        "plan_sha256": hash_file(
            plan_path
        ),
        "export_id": export_id,
        "timezone": tz,
        "roles": roles,
        "context": context,
        "windows": index,
        "messages_emitted": emitted,
        "window_term_matches": window_hits,
        "global_phrase_hits_emitted": (
            global_hits
        ),
        "laws": [
            "RECOVERY HIT != EVENT",
            "TERM MATCH != CORROBORATION",
            "MESSAGE TIME != EVENT TIME",
            "BRANCH SIBLING != SUBSEQUENT MESSAGE",
            "DERIVED PACK != SOURCE EXPORT",
        ],
    }

    (out / "recovery-index.json").write_text(
        json.dumps(
            result,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    lines = [
        f"# {name}",
        "",
        f"Export ID: {export_id}",
        (
            "Timezone for date windows: "
            f"{tz}"
        ),
        "",
        "## Recovery windows",
        "",
    ]
    for row in index:
        lines.append(
            f"- {row['window_id']} - "
            f"{row['from']} to {row['to']}: "
            f"{row['messages']} messages / "
            f"{row['conversations']} "
            "conversations / "
            f"{row['term_hits']} term hits"
        )
    lines += [
        "",
        "## Boundary",
        "",
        (
            "This is a derived recovery pack. "
            "Hits and date-window membership are "
            "retrieval facts, not event findings."
        ),
        (
            "Conversation branch structure remains "
            "authoritative over any apparent "
            "file/display order."
        ),
    ]
    (out / "report.md").write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )
    return {
        "out": str(out),
        **result,
    }
