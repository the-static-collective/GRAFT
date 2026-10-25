import json
import tempfile
import unittest
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from blackstar.chatarchive import (
    bomb_run,
    connect,
    ingest_export,
    list_conversations,
    search_messages,
    status,
    verify_source,
)


def ts(iso):
    return (
        datetime.fromisoformat(iso)
        .replace(tzinfo=timezone.utc)
        .timestamp()
    )


class ChatArchiveTests(unittest.TestCase):
    def make_export(self, root: Path):
        conv = {
            "id": "conv-1",
            "title": "Recovery test",
            "create_time": ts("2026-02-09T20:00:00"),
            "update_time": ts("2026-02-09T21:00:00"),
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
                        "create_time": ts(
                            "2026-02-09T20:10:00"
                        ),
                        "content": {
                            "content_type": "text",
                            "parts": [
                                "Correction: sole caretaker "
                                "at 4:20. "
                                "https://example.test"
                            ],
                        },
                        "metadata": {
                            "attachments": [
                                {
                                    "file_id": "file-123",
                                    "name": "note.jpg",
                                }
                            ]
                        },
                    },
                },
                "a1": {
                    "parent": "u1",
                    "children": [],
                    "message": {
                        "author": {
                            "role": "assistant"
                        },
                        "create_time": ts(
                            "2026-02-09T20:11:00"
                        ),
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
                        "author": {
                            "role": "assistant"
                        },
                        "create_time": ts(
                            "2026-02-09T20:12:00"
                        ),
                        "content": {
                            "content_type": "text",
                            "parts": [
                                "branch two chorus"
                            ],
                        },
                        "metadata": {
                            "model_slug": "synthetic"
                        },
                    },
                },
            },
        }
        path = root / "export.zip"
        with zipfile.ZipFile(
            path,
            "w",
            compression=zipfile.ZIP_DEFLATED,
        ) as archive:
            archive.writestr(
                "conversations-000.json",
                json.dumps([conv]),
            )
            archive.writestr(
                "user-asset/note.jpg",
                b"fakejpg",
            )
        return path

    def test_ingest_search_branch_and_bomb_run(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            export = self.make_export(root)
            store = root / "store"
            db = connect(store)

            result = ingest_export(
                db,
                store,
                export,
                copy_source=True,
            )
            self.assertEqual(
                result["status"],
                "imported",
            )
            again = ingest_export(
                db,
                store,
                export,
            )
            self.assertEqual(
                again["status"],
                "already_imported",
            )

            stats = status(db)
            self.assertEqual(
                stats["counts"]["conversations"],
                1,
            )
            self.assertEqual(
                stats["counts"]["messages"],
                3,
            )
            self.assertEqual(
                stats["counts"]["branch_points"],
                1,
            )
            self.assertGreaterEqual(
                stats["counts"]["signals"],
                3,
            )

            hits = search_messages(
                db,
                "branch two",
                role="assistant",
                context=2,
            )
            self.assertEqual(len(hits), 1)
            context_ids = {
                item["node_id"]
                for item in hits[0]["lineage_context"]
            }
            self.assertIn("u1", context_ids)
            self.assertNotIn("a1", context_ids)

            user_hits = search_messages(
                db,
                "sole caretaker",
                role="user",
                from_date="2026-02-09",
                to_date="2026-02-09",
                timezone_name="UTC",
            )
            self.assertEqual(len(user_hits), 1)

            conversations = list_conversations(
                db,
                from_date="2026-02-09",
                to_date="2026-02-09",
                timezone_name="UTC",
            )
            self.assertEqual(len(conversations), 1)

            plan = root / "plan.json"
            plan.write_text(
                json.dumps(
                    {
                        "name": "test bomb",
                        "timezone": "UTC",
                        "roles": [
                            "user",
                            "assistant",
                        ],
                        "context": 1,
                        "windows": [
                            {
                                "id": "feb9",
                                "from": "2026-02-09",
                                "to": "2026-02-09",
                                "terms": [
                                    "sole caretaker"
                                ],
                            }
                        ],
                        "global_terms": ["4:20"],
                    }
                ),
                encoding="utf-8",
            )
            out = root / "bomb"
            bomb = bomb_run(
                db,
                store,
                plan,
                out=out,
            )
            self.assertEqual(
                bomb["windows"][0]["messages"],
                3,
            )
            self.assertTrue(
                (
                    out / "recovery-index.json"
                ).is_file()
            )
            self.assertTrue(
                (
                    out / "messages.ndjson"
                ).is_file()
            )
            self.assertTrue(
                (
                    out / "phrase-hits.ndjson"
                ).is_file()
            )
            self.assertTrue(
                verify_source(db)["ok"]
            )
            db.close()

    def test_streaming_large_conversation_file(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            big = "x" * (
                2 * 1024 * 1024 + 333
            )
            conversations = []
            for index in range(2):
                conversations.append(
                    {
                        "id": f"big-{index}",
                        "title": "big",
                        "create_time": ts(
                            "2026-02-09T20:00:00"
                        ),
                        "current_node": "u",
                        "mapping": {
                            "u": {
                                "parent": None,
                                "children": [],
                                "message": {
                                    "author": {
                                        "role": "user"
                                    },
                                    "create_time": ts(
                                        "2026-02-09T20:00:00"
                                    ),
                                    "content": {
                                        "content_type": "text",
                                        "parts": [
                                            big
                                            if index == 0
                                            else "tail marker"
                                        ],
                                    },
                                    "metadata": {},
                                },
                            }
                        },
                    }
                )
            export = root / "big.zip"
            with zipfile.ZipFile(
                export,
                "w",
                compression=zipfile.ZIP_DEFLATED,
            ) as archive:
                archive.writestr(
                    "conversations.json",
                    json.dumps(conversations),
                )
            store = root / "store"
            db = connect(store)
            ingest_export(
                db,
                store,
                export,
            )
            self.assertEqual(
                status(db)["counts"]["conversations"],
                2,
            )
            self.assertEqual(
                len(
                    search_messages(
                        db,
                        "tail marker",
                    )
                ),
                1,
            )
            db.close()


if __name__ == "__main__":
    unittest.main()
