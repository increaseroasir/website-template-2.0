"""Static checks for GHL inventory snapshot (no network)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = Path(__file__).resolve().parent / "live_inventory_snapshot.json"
DOCS = [
    ROOT / "docs/ghl/GHL_ONBOARDING_INVENTORY.md",
    ROOT / "docs/ghl/GHL_FORM_BUILD_SPEC.md",
    ROOT / "docs/ghl/GHL_FIELD_MAPPING.md",
]


def test_snapshot_targets_htl_success_only():
    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    assert data["location"]["id"] == "wTkbEAsxM73C2gLNpdi8"
    assert data["location"]["name"] == "Hot Tub Launch Success"
    assert data["custom_field_count"] == 50
    assert data["pipelines"] == []
    missing = {
        p["product_form_id"]
        for p in data["product_forms"]
        if p["classification"] == "missing"
    }
    assert {
        "employee_crm_access",
        "initial_inventory_upload",
        "csm_call_1",
        "csm_call_2",
    } <= missing


def test_required_docs_non_empty():
    for path in DOCS:
        text = path.read_text(encoding="utf-8")
        assert path.exists()
        assert len(text.strip()) > 500
        assert "live_verified_readonly" in text
        assert "repository_derived" in text
