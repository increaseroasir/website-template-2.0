#!/usr/bin/env python3
"""Static design-freeze checks for P3 readiness docs.

Informational only — does not authorize provisioning or contact live platforms.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "provisioning"

REQUIRED_DOCS = (
    "P3_READINESS_AUDIT.md",
    "PROVISIONING_READY_GATE.md",
    "P3_FAKE_CLIENT_TEST_PLAN.md",
    "P3_FAILURE_AND_ROLLBACK_PLAN.md",
)

INFORMATIONAL_MARKERS = (
    "INFORMATIONAL ONLY",
    "informational_only",
)

FORBIDDEN_LIVE_CLAIMS = (
    "provisioning completed",
    "sub-account created successfully",
    "pages project created successfully",
)


class P3ReadinessDocsTest(unittest.TestCase):
    def test_required_docs_exist(self) -> None:
        for name in REQUIRED_DOCS:
            path = DOCS / name
            self.assertTrue(path.is_file(), f"missing {path}")

    def test_docs_marked_informational(self) -> None:
        for name in REQUIRED_DOCS:
            text = (DOCS / name).read_text(encoding="utf-8")
            self.assertTrue(
                any(marker in text for marker in INFORMATIONAL_MARKERS),
                f"{name} must declare informational-only status",
            )

    def test_gate_lists_hard_rule_and_predicates(self) -> None:
        text = (DOCS / "PROVISIONING_READY_GATE.md").read_text(encoding="utf-8")
        self.assertIn("Do **not** emit `provisioning_ready`", text)
        for needle in (
            "payment_confirmed",
            "main_client_onboarding",
            "csm_review_status",
            "client_slug",
            "sun-pool-spa",
            "Owner-approved snapshot",
        ):
            self.assertIn(needle, text)

    def test_audit_lists_missing_prerequisites(self) -> None:
        text = (DOCS / "P3_READINESS_AUDIT.md").read_text(encoding="utf-8")
        self.assertIn("Missing prerequisites", text)
        self.assertIn("P2 Form 1 synthetic E2E", text)
        self.assertIn("evidence classes", text.lower())

    def test_fake_client_slug_not_sun_pool(self) -> None:
        text = (DOCS / "P3_FAKE_CLIENT_TEST_PLAN.md").read_text(encoding="utf-8")
        self.assertIn("htl-fake-dealer-p3", text)
        self.assertIn("sun-pool-spa", text)
        self.assertRegex(text, re.compile(r"never `sun-pool-spa`|not `sun-pool-spa`", re.I))

    def test_rollback_requires_distinct_authorization(self) -> None:
        text = (DOCS / "P3_FAILURE_AND_ROLLBACK_PLAN.md").read_text(encoding="utf-8")
        self.assertIn("Distinct rollback authorization", text)
        self.assertIn("Slug never unlocks", text)

    def test_no_false_live_success_claims(self) -> None:
        for name in REQUIRED_DOCS:
            text = (DOCS / name).read_text(encoding="utf-8").lower()
            for claim in FORBIDDEN_LIVE_CLAIMS:
                self.assertNotIn(claim, text, f"{name} must not claim live success")


if __name__ == "__main__":
    unittest.main()
