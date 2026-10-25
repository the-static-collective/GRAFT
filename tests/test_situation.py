import unittest

from blackstar.situation import candidate_windows


class SituationTests(unittest.TestCase):
    def test_candidate_window_is_heuristic_only(self):
        rows = [
            (
                1,
                {
                    "_id": "1",
                    "address": "synthetic",
                    "type": "1",
                    "date": "1",
                    "body": "If you leave I will call police",
                },
            )
        ]
        found = candidate_windows(rows, identifiers={"synthetic"}, context=0)
        self.assertEqual(len(found), 1)
        self.assertIn("not conclusions", found[0]["warning"])
