import copy
import json
import unittest
from pathlib import Path

from blackstar.io import load_ndjson
from blackstar.media import (
    validate_artifact_lineage,
    validate_contact_receipt,
    validate_interpretive_attachment,
    validate_media_observations,
    validate_proxy_receipt,
)

ROOT = Path(__file__).resolve().parents[1]
SYN = ROOT / "examples/synthetic/media"


class MediaContactTests(unittest.TestCase):
    def load(self, name):
        return json.loads((SYN / name).read_text(encoding="utf-8"))

    def test_synthetic_fixtures_validate(self):
        self.assertTrue(
            validate_contact_receipt(self.load("contact-receipt.json")).ok
        )
        self.assertTrue(
            validate_artifact_lineage(self.load("artifact-lineage.json")).ok
        )
        self.assertTrue(
            validate_proxy_receipt(self.load("proxy-receipt.json")).ok
        )
        self.assertTrue(
            validate_interpretive_attachment(
                self.load("interpretive-attachment.json")
            ).ok
        )
        self.assertTrue(
            validate_media_observations(
                load_ndjson(SYN / "observations.ndjson")
            ).ok
        )

    def test_contact_cannot_precede_discovery(self):
        receipt = self.load("contact-receipt.json")
        receipt["contacted_at"] = "2025-12-31T23:59:59Z"
        self.assertFalse(validate_contact_receipt(receipt).ok)

    def test_derivative_cannot_claim_independence(self):
        lineage = self.load("artifact-lineage.json")
        lineage["derivatives"][0]["independent"] = True
        result = validate_artifact_lineage(lineage)
        self.assertFalse(result.ok)
        self.assertTrue(
            any("cannot be marked independent" in e for e in result.errors)
        )

    def test_claim_observation_requires_attribution(self):
        rows = load_ndjson(SYN / "observations.ndjson")
        broken = copy.deepcopy(rows)
        broken[2][1].pop("attributable_to")
        self.assertFalse(validate_media_observations(broken).ok)

    def test_proxy_duration_drift_is_gated(self):
        proxy = self.load("proxy-receipt.json")
        proxy["output_duration_seconds"] = 12.0
        self.assertFalse(validate_proxy_receipt(proxy).ok)

    def test_attachment_cannot_rewrite_source(self):
        attachment = self.load("interpretive-attachment.json")
        attachment["rewrite_source"] = True
        self.assertFalse(validate_interpretive_attachment(attachment).ok)
