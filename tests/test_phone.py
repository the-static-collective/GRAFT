import json
import tempfile
import unittest
from pathlib import Path

from blackstar.phone import (
    connect,
    import_notes,
    ingest_one,
    render,
    summary,
)


class PhoneWitnessTests(unittest.TestCase):
    def test_source_preserving_merge_and_render(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            store = root / "store"
            calls = root / "calls.xml"
            messages = root / "messages.xml"

            calls.write_text(
                '<calls count="3">'
                '<call date="1760000000000" number="+15550000111" '
                'contact_name="CC" type="1" duration="78"/>'
                '<call date="1760000000000" number="+15550000111" '
                'contact_name="CC" type="1" duration="78"/>'
                '<call date="1760000300000" number="555-000-0222" '
                'contact_name="C" type="3" duration="0"/>'
                '</calls>',
                encoding="utf-8",
            )
            messages.write_text(
                '<smses count="3">'
                '<sms date="1760000100000" address="+15550000111" '
                'contact_name="CC" type="2" body="&lt;message&gt;"/>'
                '<mms date="1760000200" address="5550000222" '
                'contact_name="C" msg_box="1"><parts>'
                '<part ct="text/plain" text="Hello"/>'
                '<part ct="image/jpeg" data="ZGF0YQ=="/></parts></mms>'
                '<mms date="1760000200" address="5550000222" '
                'contact_name="C" msg_box="1"><parts>'
                '<part ct="text/plain" text="Hello"/>'
                '<part ct="image/jpeg" data="b3RoZXI="/></parts></mms>'
                '</smses>',
                encoding="utf-8",
            )

            store.mkdir()
            (store / "identity-map.json").write_text(
                json.dumps(
                    {
                        "rules": [
                            {
                                "match_label": "CC",
                                "person": "Person A",
                                "basis": "owner mapping",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            db = connect(store)
            ingest_one(db, store, calls)
            ingest_one(db, store, messages)
            again = ingest_one(db, store, calls)
            self.assertEqual(again["status"], "already_imported")

            stats = summary(db)
            self.assertEqual(stats["sources"], 2)
            self.assertEqual(stats["events"], 6)
            self.assertEqual(stats["appearances"], 6)

            event_id = db.execute(
                "SELECT key FROM events WHERE kind='call' LIMIT 1"
            ).fetchone()[0]
            note = root / "notes.json"
            note.write_text(
                json.dumps(
                    {
                        "notes": [
                            {
                                "event_id": event_id,
                                "created_at": "2026-09-26T00:00:00Z",
                                "text": "later context",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            self.assertEqual(import_notes(db, note), 1)

            result = render(db, store, "America/Chicago")
            page = (store / "witness-timeline.html").read_text(encoding="utf-8")
            self.assertEqual(result["events"], 6)
            self.assertNotIn("+15550000111", page)
            self.assertIn("later context", page)
            self.assertIn("&lt;message&gt;", page)
            self.assertEqual(len(list((store / "originals").glob("*.xml"))), 2)
            db.close()
