import unittest

from blackstar.anti_narc import (
    audit_status_deltas,
    lint_claim,
    lint_mirrors,
    trace_lineage,
    validate_event_packet,
)


class AntiNarcTests(unittest.TestCase):
    def test_claim_rejects_interpretation_as_corroborated(self):
        claim = {
            "claim_id": "c1",
            "proposition": "x",
            "claimant": "A",
            "layer": "interpretation",
            "directness": "derived_interpretation",
            "epistemic_state": "corroborated",
            "source_refs": ["s1"],
            "reach_level": "private",
        }
        self.assertTrue(lint_claim(claim))

    def test_status_promotion_requires_independent_evidence(self):
        rows = [
            (
                1,
                {
                    "delta_id": "d1",
                    "from_state": "unresolved",
                    "to_state": "corroborated",
                    "new_evidence_refs": ["e1"],
                    "independence_assessment": "same_lineage",
                },
            )
        ]
        self.assertFalse(audit_status_deltas(rows).ok)


    def test_event_packet_requires_independent_receipts_for_corroboration(self):
        packet = {
            "event_id": "e1",
            "time_window": {
                "start": "2026-01-01T00:00:00Z",
                "end": "2026-01-01T00:00:01Z",
                "timezone": "UTC",
            },
            "source_facts": [
                {"fact": "x", "source_refs": ["s1"]}
            ],
            "claims": [
                {
                    "claimant": "A",
                    "proposition": "x",
                    "status": "corroborated",
                    "source_refs": ["s1"],
                }
            ],
            "interpretations": [],
            "unknowns": [],
            "authority_effects": [],
        }
        self.assertFalse(validate_event_packet(packet).ok)

    def test_synthetic_event_packet_validates(self):
        import json
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        packet = json.loads(
            (root / "examples/synthetic/event-packet.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertTrue(validate_event_packet(packet).ok)

    def test_mirror_asymmetry_requires_receipts(self):
        rows = [
            (
                1,
                {
                    "mirror_test_id": "m1",
                    "symmetry_status": "possible_double_standard",
                    "case_a": {"classification": "x"},
                    "case_b": {"classification": "y"},
                },
            )
        ]
        self.assertFalse(lint_mirrors(rows).ok)

    def test_lineage_counts_echoes_without_calling_them_independent(self):
        obj = {
            "lineage_id": "l1",
            "members": [
                {
                    "claim_id": "root",
                    "relation_to_root": "root",
                    "knowledge_origin": "root_assertion",
                },
                {
                    "claim_id": "echo",
                    "relation_to_root": "institutional_record",
                    "knowledge_origin": "root_assertion",
                },
            ],
        }
        result = trace_lineage(obj)
        self.assertTrue(result.ok)
        self.assertEqual(result.details["echoes_same_knowledge"], ["echo"])
