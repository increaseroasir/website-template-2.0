"""Static presence checks for ClickUp onboarding ops specs.

No network. No ClickUp API. Asserts required docs exist and are non-empty.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_DOCS = [
    "docs/clickup/CLICKUP_LIVE_INVENTORY.md",
    "docs/clickup/CLICKUP_ONBOARDING_TEMPLATE_SPEC.md",
    "docs/clickup/CLICKUP_FIELD_AND_STATUS_MAP.md",
    "docs/clickup/CLICKUP_CREATION_RUNBOOK.md",
]

REQUIRED_PHRASES = {
    "docs/clickup/CLICKUP_LIVE_INVENTORY.md": [
        "pending_live_inventory",
        "repository_derived",
    ],
    "docs/clickup/CLICKUP_ONBOARDING_TEMPLATE_SPEC.md": [
        "onboarding_case_id",
        "Supabase",
    ],
    "docs/clickup/CLICKUP_FIELD_AND_STATUS_MAP.md": [
        "Waiting on Client",
        "Blocked",
    ],
    "docs/clickup/CLICKUP_CREATION_RUNBOOK.md": [
        "no live creates",
        "idempotency",
    ],
}


def test_required_clickup_docs_exist_and_nonempty():
    for rel in REQUIRED_DOCS:
        path = REPO_ROOT / rel
        assert path.is_file(), f"missing required doc: {rel}"
        text = path.read_text(encoding="utf-8").strip()
        assert text, f"empty required doc: {rel}"
        for phrase in REQUIRED_PHRASES[rel]:
            assert phrase.lower() in text.lower(), f"{rel} missing phrase: {phrase}"


def test_readiness_artifact_exists():
    runs = sorted((REPO_ROOT / "artifacts/agent-runs/clickup").glob("*-clickup-readiness.md"))
    assert runs, "missing artifacts/agent-runs/clickup/*-clickup-readiness.md"
    assert runs[-1].read_text(encoding="utf-8").strip()
