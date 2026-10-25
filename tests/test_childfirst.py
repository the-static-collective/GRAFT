import copy
import json
import unittest
from pathlib import Path

from blackstar.childfirst import (
    memory_packet,
    perspective_matrix,
    validate_record,
)

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "examples/synthetic/child-life-record.json"


class ChildFirstTests(unittest.TestCase):
    def load(self):
        return json.loads(EXAMPLE.read_text(encoding="utf-8"))

    def test_example_validates(self):
        result = validate_record(self.load())
        self.assertTrue(result.ok, result.errors)

    def test_parent_scoring_is_rejected(self):
        record = self.load()
        record["analysis"] = {"custody_score": 0.8}
        result = validate_record(record)
        self.assertFalse(result.ok)
        self.assertTrue(any("scoring" in e for e in result.errors))

    def test_planned_is_not_occurred(self):
        record = self.load()
        record["occurrence_status"] = "planned"
        record["confirmed_occurred"] = True
        self.assertFalse(validate_record(record).ok)

    def test_adult_conflict_cannot_enter_memory_layer(self):
        record = self.load()
        bad = copy.deepcopy(record["accounts"][0])
        bad["account_id"] = "bad-memory"
        bad["adult_conflict"] = True
        bad["memory_eligible"] = True
        record["accounts"].append(bad)
        self.assertFalse(validate_record(record).ok)

    def test_parallel_realities_can_be_divergent_without_verdict(self):
        record = self.load()
        matrix = perspective_matrix(record)
        by_key = {item["key"]: item for item in matrix["assertions"]}
        self.assertEqual(by_key["pickup_time"]["status"], "divergent")
        self.assertIn("DIFFERENCE != VERDICT", matrix["law"])

    def test_memory_packet_filters_conflict(self):
        record = self.load()
        packet = memory_packet(record)
        ids = {item["account_id"] for item in packet["accounts"]}
        self.assertIn("a-photo-observation", ids)
        self.assertIn("a-child-quote", ids)
        self.assertNotIn("a-adult-dispute", ids)
        self.assertTrue(packet["excluded_adult_conflict"])
