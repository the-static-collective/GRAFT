"""Synthetic GRAFT-specific tests of the original, transplanted Black Star Ghost Cut."""
import copy
import unittest

from blackstar.ghostcut import validate_cut, validate_activation, observer_delta


def fixture(cut_id="early", horizon="2026-01-02T00:00:00Z"):
    return {
        "cut_id": cut_id, "observer": "synthetic-reviewer", "focus": "fictional notebook",
        "knowledge_horizon": horizon,
        "carriers": [
            {"carrier_id": "note-a", "source_ref": "specimen:note-a",
             "discovered_at": "2026-01-01T00:00:00Z", "contact": True}
        ],
        "decoder": "ordinary-reading", "stance": "open",
        "projection": None, "withheld": [], "counterpressure": [], "fog": [],
        "authority": "projection_only",
    }


class NativeGhostCutTests(unittest.TestCase):
    def test_cut_accepts_early_only(self):
        self.assertTrue(validate_cut(fixture()).ok)

    def test_cut_refuses_future_discovery(self):
        c = fixture()
        c["carriers"].append({"carrier_id": "note-b", "source_ref": "specimen:note-b",
                              "discovered_at": "2026-01-04T00:00:00Z", "contact": True})
        self.assertFalse(validate_cut(c).ok)

    def test_no_admission_without_gate_receipt(self):
        c = fixture()
        c["authority"] = "admitted"
        self.assertFalse(validate_cut(c).ok)

    def test_observer_delta_does_not_edit_old_cut(self):
        earlier = fixture()
        frozen = copy.deepcopy(earlier)
        later = fixture("later", "2026-01-05T00:00:00Z")
        later["carriers"].append({"carrier_id": "note-b", "source_ref": "specimen:note-b",
                                 "discovered_at": "2026-01-04T00:00:00Z", "contact": True})
        delta = observer_delta(earlier, later)
        self.assertEqual(delta["newly_available_or_contacted"], ["note-b"])
        self.assertEqual(earlier, frozen)

    def test_activation_refuses_retcon(self):
        receipt = {"activation_id": "re-read", "old_trace": "note-a",
                   "original_contact_at": "2026-01-01T00:00:00Z",
                   "new_trigger": "note-b", "new_trigger_at": "2026-01-05T00:00:00Z",
                   "new_decoder": "re-reading", "proposed_relation": "possible-overlap",
                   "relation_birthday": "2026-01-02T00:00:00Z",
                   "counterpressure": ["unrelated-notes"], "gate_route": "hold",
                   "no_retcon_note": "The new connection cannot exist in the earlier review.",
                   "source_refs": ["specimen:note-a", "specimen:note-b"]}
        self.assertFalse(validate_activation(receipt).ok)
        receipt["relation_birthday"] = "2026-01-05T00:00:00Z"
        self.assertTrue(validate_activation(receipt).ok)


if __name__ == "__main__":
    unittest.main()
