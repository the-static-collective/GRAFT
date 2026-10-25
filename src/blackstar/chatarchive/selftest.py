from __future__ import annotations

import json
import tempfile
import zipfile
from pathlib import Path

from ..models import ValidationResult
from .ingest import ingest_export
from .query import search_messages, status
from .schema import connect


def selftest() -> ValidationResult:
    errors, details = [], {}
    try:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            export = root / "export.zip"
            conv = {
                "id": "conv-1",
                "title": "Synthetic branch",
                "create_time": 1760000000.0,
                "current_node": "a2",
                "mapping": {
                    "root": {
                        "parent": None,
                        "children": ["u1"],
                        "message": None,
                    },
                    "u1": {
                        "parent": "root",
                        "children": ["a1", "a2"],
                        "message": {
                            "author": {"role": "user"},
                            "create_time": 1760000010.0,
                            "content": {
                                "content_type": "text",
                                "parts": [
                                    "Maybe correction: 2026-02-09 at 4:20."
                                ],
                            },
                            "metadata": {},
                        },
                    },
                    "a1": {
                        "parent": "u1",
                        "children": [],
                        "message": {
                            "author": {"role": "assistant"},
                            "create_time": 1760000020.0,
                            "content": {
                                "content_type": "text",
                                "parts": ["branch one"],
                            },
                            "metadata": {},
                        },
                    },
                    "a2": {
                        "parent": "u1",
                        "children": [],
                        "message": {
                            "author": {"role": "assistant"},
                            "create_time": 1760000030.0,
                            "content": {
                                "content_type": "text",
                                "parts": ["branch two chorus"],
                            },
                            "metadata": {},
                        },
                    },
                },
            }
            with zipfile.ZipFile(
                export,
                "w",
                compression=zipfile.ZIP_DEFLATED,
            ) as archive:
                archive.writestr(
                    "conversations.json",
                    json.dumps([conv]),
                )
            store = root / "store"
            db = connect(store)
            result = ingest_export(db, store, export)
            stats = status(db)
            hits = search_messages(
                db,
                "branch two",
                role="assistant",
                context=1,
            )
            db.close()
            if result.get("status") != "imported":
                errors.append(
                    f"unexpected ingest status: {result}"
                )
            if (
                stats["counts"]["messages"] != 3
                or stats["counts"]["branch_points"] != 1
            ):
                errors.append(
                    f"unexpected counts: {stats['counts']}"
                )
            if (
                len(hits) != 1
                or hits[0]["node_id"] != "a2"
            ):
                errors.append(
                    f"search failed: {hits}"
                )
            if any(
                x.get("node_id") == "a1"
                for x in hits[0].get("lineage_context", [])
            ):
                errors.append(
                    "branch sibling rendered as lineage context"
                )
            details = {
                "stats": stats["counts"],
                "hits": len(hits),
            }
    except Exception as exc:
        errors.append(str(exc))
    return ValidationResult.from_messages(
        errors,
        details=details,
    )
