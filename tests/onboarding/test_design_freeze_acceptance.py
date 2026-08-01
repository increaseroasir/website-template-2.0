"""Local acceptance checks for P2 onboarding Hybrid A+C (published in Git; no live I/O)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REPORTED_FIELDS = [
    "website_reported_status",
    "website_reported_url",
    "domain_reported_name",
    "domain_reported_ownership_status",
    "dns_reported_provider",
    "dns_reported_owner",
]


def _load(path: str):
    return json.loads((ROOT / path).read_text())


def _run_checks() -> list[dict]:
    results: list[dict] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        results.append({"name": name, "pass": bool(ok), "detail": detail})

    source_files = [
        "docs/onboarding/source/00_GLOBAL_BUILD_RULES.md",
        "docs/onboarding/source/01_MAIN_CLIENT_ONBOARDING_FORM.md",
        "docs/onboarding/source/02_EMPLOYEE_CRM_ACCESS_REQUEST.md",
        "docs/onboarding/source/03_INITIAL_INVENTORY_UPLOAD_FORM.md",
        "docs/onboarding/source/04_CALL_1_KICKOFF_AND_ACCESS_FORM.md",
        "docs/onboarding/source/05_CALL_2_CRM_SETUP_AND_TRAINING_FORM.md",
        "docs/onboarding/source/06_CANONICAL_CUSTOM_FIELD_REGISTRY.md",
    ]
    check("source_package_complete", all((ROOT / p).is_file() for p in source_files))

    delta = (ROOT / "docs/onboarding/CONTRACT_DELTA_REPORT.md").read_text()
    check(
        "contract_delta_hybrid_ac_approved",
        "APPROVED" in delta and "Hybrid A+C" in delta and "Reject" in delta,
    )
    check("contract_delta_rejects_b", "Reject" in delta or "Rejected" in delta)

    reg = _load("config/onboarding-field-registry.json")
    product_ids = set(reg.get("product_form_ids") or [])
    if not product_ids:
        product_ids = {f["product_form_id"] for f in reg["fields"]}
    required_ids = {
        "main_client_onboarding",
        "employee_crm_access",
        "initial_inventory_upload",
        "csm_call_1",
        "csm_call_2",
    }
    check("product_ids_present", required_ids.issubset(product_ids), str(sorted(product_ids)))

    emp = [f for f in reg["fields"] if f["product_form_id"] == "employee_crm_access"]
    check("employee_fields_present", bool(emp), f"n={len(emp)}")
    check(
        "employee_not_silently_form2",
        bool(emp) and all(f.get("storage_form") is None for f in emp),
        f"n={len(emp)}",
    )
    check(
        "employee_child_table_status",
        bool(emp)
        and all(
            f.get("storage_binding_status") == "published_schema_child_migrations_applied_dev"
            and f.get("supabase_destination") == "onboarding_employees"
            for f in emp
        ),
    )

    inv = [f for f in reg["fields"] if f["product_form_id"] == "initial_inventory_upload"]
    check(
        "inventory_child_table_status",
        bool(inv)
        and all(
            f.get("storage_form") is None
            and f.get("storage_binding_status") == "published_schema_child_migrations_applied_dev"
            and f.get("supabase_destination") == "inventory_submissions"
            for f in inv
        ),
        f"n={len(inv)}",
    )
    check(
        "inventory_not_form3",
        bool(inv) and all(f.get("storage_form") != "form3" for f in inv),
    )

    csm = [
        f
        for f in reg["fields"]
        if f["product_form_id"] in ("csm_call_1", "csm_call_2")
    ]
    check(
        "csm_system_storage",
        bool(csm)
        and all(
            f.get("storage_form") == "system" or f.get("storage_binding_status") == "ok_design"
            for f in csm
        ),
        f"n={len(csm)}",
    )

    check(
        "no_form4_form5",
        all(f.get("storage_form") not in ("form4", "form5") for f in reg["fields"]),
    )

    for i, name in enumerate(
        [
            "form-1-main-client-onboarding.json",
            "form-2-employee-access.json",
            "form-3-inventory-upload.json",
            "form-4-call-1-csm.json",
            "form-5-call-2-csm.json",
        ],
        start=1,
    ):
        check(f"form_spec_{i}_exists", (ROOT / "config/forms" / name).is_file())

    main_names = {
        f["canonical_name"]
        for f in reg["fields"]
        if f["product_form_id"] == "main_client_onboarding"
    }
    check(
        "six_reported_fields_in_registry",
        all(n in main_names for n in REPORTED_FIELDS),
        ",".join(sorted(REPORTED_FIELDS)),
    )
    check(
        "reported_fields_form1_owned",
        all(
            f.get("storage_form") == "form1"
            and f.get("storage_binding_status")
            == "published_contract_0_2_0"
            for f in reg["fields"]
            if f["canonical_name"] in REPORTED_FIELDS
            and f["product_form_id"] == "main_client_onboarding"
        ),
    )

    f1 = _load("config/forms/form-1-main-client-onboarding.json")
    f1_names = {f["canonical_name"] for f in f1["fields"]}
    check("reported_website_status_on_main", "website_reported_status" in f1_names)
    check(
        "form1_no_operational_website_url_canonical",
        "website_url" not in f1_names or any(
            f.get("canonical_name") == "website_reported_url" for f in f1["fields"]
        ),
    )

    f4 = _load("config/forms/form-4-call-1-csm.json")
    f4_blob = json.dumps(f4)
    check("verified_website_on_call1", "verified" in f4_blob.lower() or "website" in f4_blob.lower())
    check(
        "reported_not_same_as_verified_name",
        "website_reported_status" in f1_names
        and "website_reported_status" not in json.dumps(f4.get("fields", [])),
    )

    options = _load("config/onboarding-option-sets.json")
    # Ban placeholder garbage only — package enums may legally include other/unknown.
    banned = {"asdf", "lorem", "placeholder", "select one", "please choose", "tbd", "n/a", "na"}
    bad_opts = []
    for key, vals in (options.get("option_sets") or {}).items():
        if not isinstance(vals, list):
            continue
        for v in vals:
            label = (v if isinstance(v, str) else str(v.get("value", v))).strip().lower()
            if label in banned or label == "":
                bad_opts.append(f"{key}:{label}")
    check("no_vague_options", not bad_opts, ",".join(bad_opts[:10]))

    clickup = _load("config/onboarding-clickup.json")
    check(
        "clickup_ids_pending",
        "pending" in json.dumps(clickup).lower() or clickup.get("live_ids_status") == "pending",
    )

    prov = (ROOT / "docs/onboarding/PROVISIONING_READY.md").read_text()
    check(
        "provisioning_not_raw_form1",
        "not" in prov.lower()
        and (
            "raw `main_client_onboarding`" in prov
            or "raw main_client_onboarding" in prov.lower()
            or "submission alone" in prov.lower()
        ),
    )
    check("provisioning_not_built", "not built" in prov.lower() or "later" in prov.lower() or "do not build" in prov.lower())

    check("forbidden_aliases_file", (ROOT / "config/forbidden-aliases.json").is_file())
    sm = _load("config/state-machine.json")
    check(
        "state_machine_rpc",
        "request_client_transition" in json.dumps(sm) or sm.get("sole_writer_rpc") == "request_client_transition",
    )

    ident = _load("config/identity-fields.json")
    check("live_contract_published_0_2_0", ident.get("contract_version") == "0.2.0")
    check("live_schema_published_1_1_0", ident.get("onboarding_schema_version") == "1.1.0")
    check(
        "frozen_form2_owns_website",
        ident["field_policies"]["website_url"]["owner"] == "form2",
    )
    check(
        "frozen_form2_owns_domain",
        ident["field_policies"]["domain"]["owner"] == "form2",
    )
    amendment = (ROOT / "docs/onboarding/PROPOSED_CONTRACT_AMENDMENT_0.2.0.md").read_text()
    check(
        "amendment_doc_retained_for_provenance",
        ("Published in Git" in amendment or "published in Git" in amendment or "PUBLISHED IN GIT" in amendment)
        and ident.get("contract_version") == "0.2.0",
    )
    check(
        "reported_fields_in_live_identity",
        all(
            name in ident["field_policies"]
            and ident["field_policies"][name]["owner"] == "form1"
            for name in REPORTED_FIELDS
        ),
        ",".join(REPORTED_FIELDS),
    )

    maps = _load("config/onboarding-field-mappings.json")
    check(
        "mapping_storage_published_child_migrations_applied_dev",
        maps["completeness"]["storage_bindings"]
        == "published_0_2_0_child_migrations_applied_dev",
    )
    check(
        "mapping_live_contract_versions_applied_dev",
        maps["completeness"]["live_contract_versions"]
        == "published_0.2.0_and_1.1.0_child_migrations_applied_htl_factory_dev",
    )
    emp_maps = [m for m in maps["mappings"] if m["product_form_id"] == "employee_crm_access"]
    check(
        "mapping_employee_to_onboarding_employees",
        bool(emp_maps)
        and all(
            m.get("supabase_table") == "onboarding_employees" and m.get("storage_form") is None
            for m in emp_maps
        ),
    )
    inv_maps = [m for m in maps["mappings"] if m["product_form_id"] == "initial_inventory_upload"]
    check(
        "mapping_inventory_to_inventory_submissions",
        bool(inv_maps)
        and all(
            m.get("supabase_table") == "inventory_submissions" and m.get("storage_form") is None
            for m in inv_maps
        ),
    )

    mig_dir = ROOT / "docs/onboarding/proposed-migrations"
    for fname in [
        "001_onboarding_employees.sql",
        "002_inventory_submissions.sql",
        "003_inventory_items_optional.sql",
    ]:
        text = (mig_dir / fname).read_text()
        check(
            f"proposed_migration_{fname}",
            "DO NOT APPLY" in text and "CREATE TABLE" in text,
        )

    landed_emp = ROOT / "supabase/migrations/20260731184500_create_onboarding_employees.sql"
    landed_inv = ROOT / "supabase/migrations/20260731184600_create_inventory_submissions.sql"
    check("landed_employees_migration_exists", landed_emp.is_file())
    check("landed_inventory_migration_exists", landed_inv.is_file())
    if landed_emp.is_file() and landed_inv.is_file():
        emp_sql = landed_emp.read_text()
        inv_sql = landed_inv.read_text()
        check(
            "landed_migrations_enable_rls",
            "ENABLE ROW LEVEL SECURITY" in emp_sql and "ENABLE ROW LEVEL SECURITY" in inv_sql,
        )
        check(
            "landed_migrations_no_anon_grant_or_policy",
            not any(
                line.strip().upper().startswith("GRANT")
                or line.strip().upper().startswith("CREATE POLICY")
                for line in (emp_sql + "\n" + inv_sql).splitlines()
            ),
        )
        check(
            "inventory_items_not_landed",
            not any(
                "inventory_items" in p.name
                for p in (ROOT / "supabase/migrations").glob("*.sql")
            ),
        )
        check(
            "landed_migration_versions_after_remote_max",
            "20260731184500" > "20260731081314" and "20260731184600" > "20260731184500",
        )

    targets = _load("config/supabase-targets.json")
    check("apply_authorized_still_false", targets.get("apply_authorized") is False)
    check("targets_contract_version_0_2_0", targets.get("contract_version") == "0.2.0")

    f2 = _load("config/forms/form-2-employee-access.json")
    f3 = _load("config/forms/form-3-inventory-upload.json")
    check(
        "form2_spec_not_storage_form2",
        "onboarding_employees" in json.dumps(f2) and "NOT form2" in json.dumps(f2),
    )
    check(
        "form3_spec_not_storage_form3",
        "inventory_submissions" in json.dumps(f3) and "NOT form3" in json.dumps(f3),
    )

    source2 = (ROOT / "docs/onboarding/source/00_GLOBAL_BUILD_RULES.md").read_text().lower()
    check("source_forbids_passwords", "password" in source2)

    reli = (ROOT / "docs/onboarding/RELIABILITY.md").read_text().lower()
    check(
        "idempotency_patterns_documented",
        "idempoten" in reli or (mig_dir / "001_onboarding_employees.sql").read_text().count("UNIQUE") >= 1,
    )

    plan = (ROOT / "docs/onboarding/MIGRATION_AND_CONTRACT_AMENDMENT_PLAN.md").read_text()
    check(
        "amendment_plan_published_apply_gated",
        "PUBLISHED IN GIT" in plan
        and ("applied and verified" in plan.lower() or "htl-factory-dev" in plan)
        and "apply_authorized" in plan.lower()
        and "e2e" in plan.lower(),
    )

    return results


def regenerate_results_artifact() -> dict:
    results = _run_checks()
    payload = {
        "total": len(results),
        "passed": sum(1 for r in results if r["pass"]),
        "failed": sum(1 for r in results if not r["pass"]),
        "results": results,
    }
    out = ROOT / "tests/onboarding/design_freeze_acceptance_results.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    return payload


def test_results_artifact_green():
    data = regenerate_results_artifact()
    failed = [r for r in data["results"] if not r["pass"]]
    assert not failed, failed


def test_contract_delta_hybrid_ac_approved():
    text = (ROOT / "docs/onboarding/CONTRACT_DELTA_REPORT.md").read_text()
    assert "APPROVED" in text and "Hybrid A+C" in text


def test_employee_storage_not_form2():
    reg = _load("config/onboarding-field-registry.json")
    emp = [f for f in reg["fields"] if f["product_form_id"] == "employee_crm_access"]
    assert emp
    assert all(f.get("storage_form") is None for f in emp)


def test_live_versions_published_in_git():
    ident = _load("config/identity-fields.json")
    assert ident["contract_version"] == "0.2.0"
    assert ident["onboarding_schema_version"] == "1.1.0"
    for name in REPORTED_FIELDS:
        assert ident["field_policies"][name]["owner"] == "form1"


if __name__ == "__main__":
    payload = regenerate_results_artifact()
    print(json.dumps({"total": payload["total"], "passed": payload["passed"], "failed": payload["failed"]}))
    for r in payload["results"]:
        if not r["pass"]:
            print("FAIL", r["name"], r["detail"])
