import copy
import unittest

import weves


def ref(name):
    return weves.particular(name, f"https://example.org/public/{name}", "source pointer")


class WevesTest(unittest.TestCase):
    def setUp(self):
        self.a, self.b, self.c = ref("a"), ref("b"), ref("c")
        self.w = weves.weave("small weave", [(self.a, "offers"), (self.b, "relates")], "one candidate relation")
        self.meta = weves.weave("weave of weaves", [(self.w, "reuse"), (self.c, "new")], "fork again")
        self.candidate = weves.weve_candidate("first act", self.meta, "try one task", "volunteer steward")
        self.doc = weves.bundle("test", [self.a, self.b, self.c, self.w, self.meta, self.candidate], self.candidate)

    def test_stable_hash_and_valid_document(self):
        self.assertTrue(weves.validate(self.doc))
        self.assertEqual(weves.specimen(), weves.specimen())
        self.assertEqual(self.a, ref("a"))

    def test_recursive_weaves_keep_distinct_inputs(self):
        self.assertEqual(self.meta["inputs"][0]["ref"], self.w["id"])
        self.assertEqual(self.w["inputs"][0]["ref"], self.a["id"])
        self.assertEqual(self.candidate["stage"], "PROPOSE_ONLY")
        self.assertEqual(self.candidate["field_outcome"], "NOT_CLAIMED")

    def test_mutated_payload_fails_integrity(self):
        bad = copy.deepcopy(self.doc)
        bad["nodes"][0]["title"] = "tampered"
        with self.assertRaisesRegex(ValueError, "hash"):
            weves.validate(bad)

    def test_missing_input_cannot_masquerade_as_weave(self):
        bad = copy.deepcopy(self.doc)
        bad["nodes"].remove(bad["nodes"][1])
        with self.assertRaises(ValueError):
            weves.validate(bad)

    def test_cycle_or_forward_reference_fails(self):
        bad = copy.deepcopy(self.doc)
        x = bad["nodes"][3]
        bad["nodes"].remove(x)
        bad["nodes"].insert(0, x)
        with self.assertRaisesRegex(ValueError, "forward"):
            weves.validate(bad)

    def test_duplicate_input_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            weves.weave("dup", [(self.a, "same"), (self.a, "same")], "not two")

    def test_single_input_rejected(self):
        with self.assertRaises(ValueError):
            weves.weave("solo", [(self.a, "one")], "no")

    def test_private_not_allowed(self):
        bad = copy.deepcopy(self.doc)
        original = bad["nodes"][0]
        original["privacy"] = "PRIVATE"
        original["id"] = weves.address({k: v for k, v in original.items() if k != "id"})
        with self.assertRaisesRegex(ValueError, "private"):
            weves.validate(bad)

    def test_forged_field_outcome_rejected_even_with_hash(self):
        bad = copy.deepcopy(self.doc)
        target = bad["nodes"][-1]
        target["field_outcome"] = "VERIFIED_DELIVERY"
        target["id"] = weves.address({k: v for k, v in target.items() if k != "id"})
        bad["root"] = target["id"]
        with self.assertRaisesRegex(ValueError, "field outcome"):
            weves.validate(bad)

    def test_forged_consent_rejected(self):
        bad = copy.deepcopy(self.doc)
        target = bad["nodes"][-1]
        target["participant_consent"] = "CONSENTED"
        target["id"] = weves.address({k: v for k, v in target.items() if k != "id"})
        bad["root"] = target["id"]
        with self.assertRaisesRegex(ValueError, "consent"):
            weves.validate(bad)

    def test_weave_cannot_be_automatically_admitted(self):
        bad = copy.deepcopy(self.doc)
        target = bad["nodes"][3]
        target["authority"] = "GLOBAL_ADOPTED"
        target["id"] = weves.address({k: v for k, v in target.items() if k != "id"})
        with self.assertRaises(ValueError):
            weves.validate(bad)

    def test_return_is_report_not_proof(self):
        r = weves.return_report(self.candidate, "https://example.org/public/receipt", "human says test ran")
        self.assertEqual(r["real_world_verification"], "NOT_ESTABLISHED_BY_THIS_TOOL")
        self.assertEqual(r["review_state"], "UNREVIEWED")
        self.assertTrue(weves.validate(weves.bundle("with return", [*self.doc["nodes"], r], r)))

    def test_forged_review_rejected(self):
        with self.assertRaisesRegex(ValueError, "verification"):
            weves.return_report(self.candidate, "https://example.org/receipt", "done", "VERIFIED")

    def test_no_query_secret_urls(self):
        with self.assertRaises(ValueError):
            weves.particular("bad", "https://example.org/?token=abc", "pointer")
        with self.assertRaises(ValueError):
            weves.particular("bad", "http://example.org/public", "pointer")

    def test_reference_only_is_not_field_evidence(self):
        with self.assertRaises(ValueError):
            weves.particular("x", "https://example.org/x", "field witness", "VERIFIED_DELIVERY")

    def test_reweave_is_genuinely_forkable(self):
        forked = weves.reweave(self.doc, "new circle", "neighbor-owned tool",
                              "https://example.net/public/tool", "voluntary craft",
                              "try an opt-in practical action")
        self.assertTrue(weves.validate(forked))
        self.assertEqual(forked["nodes"][:len(self.doc["nodes"])], self.doc["nodes"])
        candidate = forked["nodes"][-1]
        self.assertEqual(candidate["stage"], "PROPOSE_ONLY")
        new_weave = forked["nodes"][-2]
        self.assertEqual(new_weave["inputs"][0]["ref"], self.meta["id"])

    def test_reweave_rejects_missing_or_private_source_pointer(self):
        with self.assertRaises(ValueError):
            weves.reweave(self.doc, "x", "private", "file:///mycase.db", "case", "act")

    def test_reweave_fails_if_same_source_node_already_exists(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            weves.reweave(self.doc, "duplicate", "a",
                          "https://example.org/public/a", "source pointer", "act")

    def test_specimen_contains_reusable_nested_weaves(self):
        specimen = weves.specimen()
        self.assertTrue(weves.validate(specimen))
        self.assertEqual(len([x for x in specimen["nodes"] if x["kind"] == "weave"]), 6)
        self.assertEqual(len([x for x in specimen["nodes"] if x["kind"] == "weve"]), 1)


if __name__ == "__main__":
    unittest.main()
