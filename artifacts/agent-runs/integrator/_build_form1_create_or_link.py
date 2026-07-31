#!/usr/bin/env python3
"""Build inactive Form 1 create-or-link Make blueprint (dev_test only).

Matching order (mandatory):
  1) valid client_id
  2) deployment_key (exactly one)
  3) normalized client_slug (exactly one)
Never auto-link on ghl_contact_id, email, phone, business_name, domain, or fuzzy match.

Fail closed:
  - conflicting high-confidence identifiers → identity_conflict (no create)
  - multiple rows for one identifier → review_required (no create)
  - supplied client_id with zero hits → identity_conflict (no create)
  - create only when no high-confidence identifier resolves to an existing client
"""

from __future__ import annotations

import json
from pathlib import Path

CONN = 4834536
HOOK = 2785703
ROOT = Path(__file__).resolve().parents[3]

PAYLOAD = (
    '{"contract_version":"0.2.0","onboarding_schema_version":"1.1.0","schema_version":"1.1.0",'
    '"submission_id":"{{1.submission_id}}","correlation_id":"{{1.correlation_id}}",'
    '"client_slug":"{{1.client_slug}}","deployment_key":"{{1.deployment_key}}","domain":"{{1.domain}}",'
    '"business_name":"{{1.business_name}}","owner_name":"{{1.owner_name}}","owner_email":"{{1.owner_email}}",'
    '"owner_phone":"{{1.owner_phone}}","offer_summary":"{{1.offer_summary}}","market":"{{1.market}}",'
    '"ghl_contact_id":"{{1.ghl_contact_id}}","ghl_opportunity_id":"{{1.ghl_opportunity_id}}",'
    '"website_reported_status":"{{1.website_reported_status}}","website_reported_url":"{{1.website_reported_url}}",'
    '"domain_reported_name":"{{1.domain_reported_name}}",'
    '"domain_reported_ownership_status":"{{1.domain_reported_ownership_status}}",'
    '"dns_reported_provider":"{{1.dns_reported_provider}}","dns_reported_owner":"{{1.dns_reported_owner}}"}'
)

# Form1 owned / reported only — never Form2 operational website_url/domain/dns_provider/dns_owner
CONFIG = (
    '{"contract_version":"0.2.0","onboarding_schema_version":"1.1.0",'
    '"business_name":"{{1.business_name}}","owner_name":"{{1.owner_name}}","owner_email":"{{1.owner_email}}",'
    '"owner_phone":"{{1.owner_phone}}","offer_summary":"{{1.offer_summary}}","market":"{{1.market}}",'
    '"ghl_contact_id":"{{1.ghl_contact_id}}","ghl_opportunity_id":"{{1.ghl_opportunity_id}}",'
    '"website_reported_status":"{{1.website_reported_status}}","website_reported_url":"{{1.website_reported_url}}",'
    '"domain_reported_name":"{{1.domain_reported_name}}",'
    '"domain_reported_ownership_status":"{{1.domain_reported_ownership_status}}",'
    '"dns_reported_provider":"{{1.dns_reported_provider}}","dns_reported_owner":"{{1.dns_reported_owner}}"}'
)

CLIENT_SELECT = "client_id,client_slug,deployment_key,domain,business_name"


def filt(name: str, conditions: list) -> dict:
    return {"name": name, "conditions": conditions}


def cond(a: str, o: str, b: str | None = None) -> dict:
    item = {"a": a, "o": o}
    if b is not None:
        item["b"] = b
    return item


def respond(
    mid: int, body: str, status: int, x: int, y: int, filter_obj: dict | None = None
) -> dict:
    module = {
        "id": mid,
        "module": "gateway:WebhookRespond",
        "version": 1,
        "parameters": {},
        "mapper": {"body": body, "status": status},
        "metadata": {"designer": {"x": x, "y": y}},
    }
    if filter_obj:
        module["filter"] = filter_obj
    return module


def conflict(mid: int, error: str, y: int, filter_obj: dict) -> dict:
    return {
        "flow": [
            respond(
                mid,
                (
                    '{"ok":false,"outcome":"identity_conflict","error":"%s",'
                    '"contract_version":"0.2.0","onboarding_schema_version":"1.1.0"}' % error
                ),
                409,
                2400,
                y,
                filter_obj,
            )
        ]
    }


def review(mid: int, error: str, y: int, filter_obj: dict) -> dict:
    return {
        "flow": [
            respond(
                mid,
                (
                    '{"ok":false,"outcome":"review_required","error":"%s",'
                    '"contract_version":"0.2.0","onboarding_schema_version":"1.1.0"}' % error
                ),
                409,
                2400,
                y,
                filter_obj,
            )
        ]
    }


def make_create_path(base_id: int, y: int = 500) -> list[dict]:
    c_id, case_id, patch_id, intake_id, cfg_id, rpc_id, resp_id = range(base_id, base_id + 7)
    return [
        {
            "id": c_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "table": "clients",
                "domain": "{{1.domain}}",
                "client_slug": "{{1.client_slug}}",
                "business_name": "{{1.business_name}}",
                "deployment_key": "{{1.deployment_key}}",
                "ghl_contact_id": "{{1.ghl_contact_id}}",
            },
            "metadata": {"designer": {"x": 2400, "y": y}},
        },
        {
            "id": case_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "table": "onboarding_cases",
                "status": "submitted",
                "version": "1",
                "client_id": "{{%d.client_id}}" % c_id,
                "correlation_id": "{{1.correlation_id}}",
                "ghl_contact_id": "{{1.ghl_contact_id}}",
                "ghl_opportunity_id": "{{1.ghl_opportunity_id}}",
                "onboarding_schema_version": "1.1.0",
            },
            "metadata": {"designer": {"x": 2700, "y": y}},
        },
        {
            "id": patch_id,
            "module": "supabase:makeAnApiCall",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "url": "/rest/v1/clients?client_id=eq.{{%d.client_id}}" % c_id,
                "body": '{"active_onboarding_case_id":"{{%d.onboarding_case_id}}"}' % case_id,
                "method": "PATCH",
                "headers": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Prefer", "value": "return=representation"},
                ],
            },
            "metadata": {"designer": {"x": 3000, "y": y}},
        },
        {
            "id": intake_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "form": "form1",
                "table": "intake_submissions",
                "payload": PAYLOAD,
                "client_id": "{{%d.client_id}}" % c_id,
                "submission_id": "{{1.submission_id}}",
                "correlation_id": "{{1.correlation_id}}",
                "ghl_contact_id": "{{1.ghl_contact_id}}",
                "schema_version": "1.1.0",
                "onboarding_case_id": "{{%d.onboarding_case_id}}" % case_id,
            },
            "metadata": {"designer": {"x": 3300, "y": y}},
        },
        {
            "id": cfg_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "table": "config_versions",
                "config": CONFIG,
                "client_id": "{{%d.client_id}}" % c_id,
                "source_form": "form1",
                "submission_id": "{{1.submission_id}}",
                "config_version": "1",
                "correlation_id": "{{1.correlation_id}}",
                "onboarding_case_id": "{{%d.onboarding_case_id}}" % case_id,
            },
            "metadata": {"designer": {"x": 3600, "y": y}},
        },
        {
            "id": rpc_id,
            "module": "supabase:makeAnApiCall",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "url": "/rest/v1/rpc/request_client_transition",
                "body": (
                    '{"p_client_id":"{{%d.client_id}}",'
                    '"p_onboarding_case_id":"{{%d.onboarding_case_id}}",'
                    '"p_expected_current_status":"submitted","p_requested_status":"under_review",'
                    '"p_expected_version":1,"p_actor":"make_service",'
                    '"p_correlation_id":"{{1.correlation_id}}","p_reason":"form1_intake_auto_review",'
                    '"p_idempotency_key":"transition:{{%d.onboarding_case_id}}:under_review:{{1.correlation_id}}"}'
                )
                % (c_id, case_id, case_id),
                "method": "POST",
                "headers": [{"key": "Content-Type", "value": "application/json"}],
            },
            "metadata": {"designer": {"x": 3900, "y": y}},
        },
        respond(
            resp_id,
            (
                '{"ok":true,"outcome":"created","idempotent":false,'
                '"client_id":"{{%d.client_id}}",'
                '"onboarding_case_id":"{{%d.onboarding_case_id}}",'
                '"status":"under_review","contract_version":"0.2.0","onboarding_schema_version":"1.1.0"}'
            )
            % (c_id, case_id),
            200,
            4200,
            y,
        ),
    ]


def make_link_path(lookup_mod_id: int, base_id: int, y: int) -> list[dict]:
    """New case on existing client_id. Does not create/update clients row fields (no Form2 overwrite)."""
    case_id, patch_id, intake_id, cfg_id, rpc_id, resp_id = range(base_id, base_id + 6)
    client_ref = "{{%d.body[1].client_id}}" % lookup_mod_id
    return [
        {
            "id": case_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "table": "onboarding_cases",
                "status": "submitted",
                "version": "1",
                "client_id": client_ref,
                "correlation_id": "{{1.correlation_id}}",
                "ghl_contact_id": "{{1.ghl_contact_id}}",
                "ghl_opportunity_id": "{{1.ghl_opportunity_id}}",
                "onboarding_schema_version": "1.1.0",
            },
            "metadata": {"designer": {"x": 2700, "y": y}},
        },
        {
            "id": patch_id,
            "module": "supabase:makeAnApiCall",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "url": "/rest/v1/clients?client_id=eq.%s" % client_ref,
                "body": '{"active_onboarding_case_id":"{{%d.onboarding_case_id}}"}' % case_id,
                "method": "PATCH",
                "headers": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Prefer", "value": "return=representation"},
                ],
            },
            "metadata": {"designer": {"x": 3000, "y": y}},
        },
        {
            "id": intake_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "form": "form1",
                "table": "intake_submissions",
                "payload": PAYLOAD,
                "client_id": client_ref,
                "submission_id": "{{1.submission_id}}",
                "correlation_id": "{{1.correlation_id}}",
                "ghl_contact_id": "{{1.ghl_contact_id}}",
                "schema_version": "1.1.0",
                "onboarding_case_id": "{{%d.onboarding_case_id}}" % case_id,
            },
            "metadata": {"designer": {"x": 3300, "y": y}},
        },
        {
            "id": cfg_id,
            "module": "supabase:createARow",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "table": "config_versions",
                "config": CONFIG,
                "client_id": client_ref,
                "source_form": "form1",
                "submission_id": "{{1.submission_id}}",
                "config_version": "1",
                "correlation_id": "{{1.correlation_id}}",
                "onboarding_case_id": "{{%d.onboarding_case_id}}" % case_id,
            },
            "metadata": {"designer": {"x": 3600, "y": y}},
        },
        {
            "id": rpc_id,
            "module": "supabase:makeAnApiCall",
            "version": 1,
            "parameters": {"__IMTCONN__": CONN},
            "mapper": {
                "url": "/rest/v1/rpc/request_client_transition",
                "body": (
                    '{"p_client_id":"%s",'
                    '"p_onboarding_case_id":"{{%d.onboarding_case_id}}",'
                    '"p_expected_current_status":"submitted","p_requested_status":"under_review",'
                    '"p_expected_version":1,"p_actor":"make_service",'
                    '"p_correlation_id":"{{1.correlation_id}}","p_reason":"form1_intake_auto_review",'
                    '"p_idempotency_key":"transition:{{%d.onboarding_case_id}}:under_review:{{1.correlation_id}}"}'
                )
                % (client_ref, case_id, case_id),
                "method": "POST",
                "headers": [{"key": "Content-Type", "value": "application/json"}],
            },
            "metadata": {"designer": {"x": 3900, "y": y}},
        },
        respond(
            resp_id,
            (
                '{"ok":true,"outcome":"linked","idempotent":false,'
                '"client_id":"%s",'
                '"onboarding_case_id":"{{%d.onboarding_case_id}}",'
                '"status":"under_review","contract_version":"0.2.0","onboarding_schema_version":"1.1.0"}'
            )
            % (client_ref, case_id),
            200,
            4200,
            y,
        ),
    ]


def build_blueprint() -> dict:
    # Lookups: 5=client_id, 6=deployment_key, 7=client_slug, 8=opportunity
    create_modules = make_create_path(70, y=600)
    create_modules[0]["filter"] = filt(
        "create_new",
        [
            [
                # no client_id supplied (or sentinel miss already ensures [])
                cond("{{1.client_id}}", "notexist"),
                cond("{{5.body}}", "text:equal", "[]"),
                cond("{{6.body}}", "text:equal", "[]"),
                cond("{{7.body}}", "text:equal", "[]"),
                cond("{{8.body}}", "text:equal", "[]"),
            ]
        ],
    )

    link_by_id = make_link_path(5, 30, y=200)
    link_by_id[0]["filter"] = filt(
        "link_by_client_id",
        [
            [
                cond("{{1.client_id}}", "exist"),
                cond("{{5.body}}", "text:notequal", "[]"),
                cond("{{length(5.body)}}", "numeric:equal", "1"),
                cond("{{8.body}}", "text:equal", "[]"),
                # key/slug must agree when they also resolve
                # (disagreement handled by earlier conflict routes)
            ]
        ],
    )

    link_by_key = make_link_path(6, 40, y=350)
    # deployment_key wins when no client_id; slug must agree if supplied
    link_by_key[0]["filter"] = filt(
        "link_by_deployment_key",
        [
            [
                cond("{{1.client_id}}", "notexist"),
                cond("{{6.body}}", "text:notequal", "[]"),
                cond("{{length(6.body)}}", "numeric:equal", "1"),
                cond("{{8.body}}", "text:equal", "[]"),
                cond("{{1.client_slug}}", "notexist"),
            ],
            [
                cond("{{1.client_id}}", "notexist"),
                cond("{{6.body}}", "text:notequal", "[]"),
                cond("{{length(6.body)}}", "numeric:equal", "1"),
                cond("{{8.body}}", "text:equal", "[]"),
                cond("{{7.body}}", "text:notequal", "[]"),
                cond("{{length(7.body)}}", "numeric:equal", "1"),
                cond("{{6.body[1].client_id}}", "text:equal", "{{7.body[1].client_id}}"),
            ],
        ],
    )

    link_by_slug = make_link_path(7, 50, y=480)
    # client_slug only when no client_id and no deployment_key resolution
    link_by_slug[0]["filter"] = filt(
        "link_by_client_slug",
        [
            [
                cond("{{1.client_id}}", "notexist"),
                cond("{{1.deployment_key}}", "notexist"),
                cond("{{6.body}}", "text:equal", "[]"),
                cond("{{7.body}}", "text:notequal", "[]"),
                cond("{{length(7.body)}}", "numeric:equal", "1"),
                cond("{{8.body}}", "text:equal", "[]"),
            ]
        ],
    )

    return {
        "name": "HTL Factory Form 1 Intake (dev_test)",
        "metadata": {"instant": True, "version": 1},
        "scheduling": {"type": "immediately"},
        "interface": {"input": [], "output": []},
        "flow": [
            {
                "id": 1,
                "module": "gateway:CustomWebHook",
                "version": 1,
                "parameters": {"hook": HOOK},
                "mapper": {},
                "metadata": {"designer": {"x": 0, "y": 0}},
            },
            {
                "id": 2,
                "module": "supabase:makeAnApiCall",
                "version": 1,
                "parameters": {"__IMTCONN__": CONN},
                "mapper": {
                    "url": "/rest/v1/intake_submissions",
                    "method": "GET",
                    "qs": [
                        {"key": "form", "value": "eq.form1"},
                        {
                            "key": "select",
                            "value": "intake_submission_id,client_id,onboarding_case_id",
                        },
                        {"key": "submission_id", "value": "eq.{{1.submission_id}}"},
                    ],
                    "headers": [{"key": "Accept", "value": "application/json"}],
                },
                "metadata": {"designer": {"x": 300, "y": 0}},
            },
            {
                "id": 3,
                "module": "builtin:BasicRouter",
                "version": 1,
                "parameters": {},
                "mapper": {},
                "metadata": {"designer": {"x": 600, "y": 0}},
                "routes": [
                    {
                        "flow": [
                            respond(
                                4,
                                (
                                    '{"ok":true,"outcome":"replayed","idempotent":true,'
                                    '"result":{{2.body}},"contract_version":"0.2.0",'
                                    '"onboarding_schema_version":"1.1.0"}'
                                ),
                                200,
                                1000,
                                -250,
                                filt(
                                    "replay",
                                    [[cond("{{2.body}}", "text:notequal", "[]")]],
                                ),
                            )
                        ]
                    },
                    {
                        "flow": [
                            {
                                "id": 5,
                                "filter": filt(
                                    "not_replay",
                                    [[cond("{{2.body}}", "text:equal", "[]")]],
                                ),
                                "module": "supabase:makeAnApiCall",
                                "version": 1,
                                "parameters": {"__IMTCONN__": CONN},
                                "mapper": {
                                    "url": "/rest/v1/clients",
                                    "method": "GET",
                                    "qs": [
                                        {
                                            "key": "client_id",
                                            "value": (
                                                "eq.{{if(1.client_id; 1.client_id; "
                                                '"00000000-0000-0000-0000-000000000000")}}'
                                            ),
                                        },
                                        {"key": "select", "value": CLIENT_SELECT},
                                    ],
                                    "headers": [
                                        {"key": "Accept", "value": "application/json"}
                                    ],
                                },
                                "metadata": {"designer": {"x": 900, "y": 100}},
                            },
                            {
                                "id": 6,
                                "module": "supabase:makeAnApiCall",
                                "version": 1,
                                "parameters": {"__IMTCONN__": CONN},
                                "mapper": {
                                    "url": "/rest/v1/clients",
                                    "method": "GET",
                                    "qs": [
                                        {
                                            "key": "deployment_key",
                                            "value": (
                                                "eq.{{if(1.deployment_key; 1.deployment_key; "
                                                '"__no_deployment_key__")}}'
                                            ),
                                        },
                                        {"key": "select", "value": CLIENT_SELECT},
                                    ],
                                    "headers": [
                                        {"key": "Accept", "value": "application/json"}
                                    ],
                                },
                                "metadata": {"designer": {"x": 1200, "y": 100}},
                            },
                            {
                                "id": 7,
                                "module": "supabase:makeAnApiCall",
                                "version": 1,
                                "parameters": {"__IMTCONN__": CONN},
                                "mapper": {
                                    "url": "/rest/v1/clients",
                                    "method": "GET",
                                    "qs": [
                                        {
                                            "key": "client_slug",
                                            "value": (
                                                "eq.{{if(1.client_slug; 1.client_slug; "
                                                '"__no_client_slug__")}}'
                                            ),
                                        },
                                        {"key": "select", "value": CLIENT_SELECT},
                                    ],
                                    "headers": [
                                        {"key": "Accept", "value": "application/json"}
                                    ],
                                },
                                "metadata": {"designer": {"x": 1500, "y": 100}},
                            },
                            {
                                "id": 8,
                                "module": "supabase:makeAnApiCall",
                                "version": 1,
                                "parameters": {"__IMTCONN__": CONN},
                                "mapper": {
                                    "url": "/rest/v1/onboarding_cases",
                                    "method": "GET",
                                    "qs": [
                                        {
                                            "key": "ghl_opportunity_id",
                                            "value": (
                                                "eq.{{if(1.ghl_opportunity_id; 1.ghl_opportunity_id; "
                                                '"__no_opportunity__")}}'
                                            ),
                                        },
                                        {
                                            "key": "select",
                                            "value": "onboarding_case_id,client_id,ghl_opportunity_id",
                                        },
                                    ],
                                    "headers": [
                                        {"key": "Accept", "value": "application/json"}
                                    ],
                                },
                                "metadata": {"designer": {"x": 1800, "y": 100}},
                            },
                            {
                                "id": 9,
                                "module": "builtin:BasicRouter",
                                "version": 1,
                                "parameters": {},
                                "mapper": {},
                                "metadata": {"designer": {"x": 2100, "y": 100}},
                                "routes": [
                                    # --- review_required: multi-match on any identifier ---
                                    review(
                                        10,
                                        "multiple_clients_for_client_id",
                                        -400,
                                        filt(
                                            "multi_client_id",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "exist"),
                                                    cond(
                                                        "{{length(5.body)}}",
                                                        "numeric:greater",
                                                        "1",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    review(
                                        11,
                                        "multiple_clients_for_deployment_key",
                                        -340,
                                        filt(
                                            "multi_deployment_key",
                                            [
                                                [
                                                    cond(
                                                        "{{length(6.body)}}",
                                                        "numeric:greater",
                                                        "1",
                                                    )
                                                ]
                                            ],
                                        ),
                                    ),
                                    review(
                                        12,
                                        "multiple_clients_for_client_slug",
                                        -280,
                                        filt(
                                            "multi_client_slug",
                                            [
                                                [
                                                    cond(
                                                        "{{length(7.body)}}",
                                                        "numeric:greater",
                                                        "1",
                                                    )
                                                ]
                                            ],
                                        ),
                                    ),
                                    # --- identity_conflict ---
                                    conflict(
                                        13,
                                        "ghl_opportunity_id_already_bound",
                                        -220,
                                        filt(
                                            "opportunity_bound",
                                            [
                                                [
                                                    cond(
                                                        "{{1.ghl_opportunity_id}}", "exist"
                                                    ),
                                                    cond(
                                                        "{{8.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        14,
                                        "client_id_not_found",
                                        -160,
                                        filt(
                                            "client_id_miss",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "exist"),
                                                    cond(
                                                        "{{5.body}}", "text:equal", "[]"
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        15,
                                        "client_id_deployment_key_disagree",
                                        -100,
                                        filt(
                                            "id_key_disagree",
                                            [
                                                [
                                                    cond(
                                                        "{{5.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{6.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{5.body[1].client_id}}",
                                                        "text:notequal",
                                                        "{{6.body[1].client_id}}",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        16,
                                        "client_id_client_slug_disagree",
                                        -40,
                                        filt(
                                            "id_slug_disagree",
                                            [
                                                [
                                                    cond(
                                                        "{{5.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{7.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{5.body[1].client_id}}",
                                                        "text:notequal",
                                                        "{{7.body[1].client_id}}",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        17,
                                        "deployment_key_client_slug_disagree",
                                        20,
                                        filt(
                                            "key_slug_disagree",
                                            [
                                                [
                                                    cond(
                                                        "{{6.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{7.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{6.body[1].client_id}}",
                                                        "text:notequal",
                                                        "{{7.body[1].client_id}}",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        18,
                                        "deployment_key_mismatch_for_client_slug",
                                        80,
                                        filt(
                                            "key_miss_slug_hit",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "notexist"),
                                                    cond(
                                                        "{{5.body}}", "text:equal", "[]"
                                                    ),
                                                    cond(
                                                        "{{6.body}}", "text:equal", "[]"
                                                    ),
                                                    cond(
                                                        "{{1.deployment_key}}", "exist"
                                                    ),
                                                    cond(
                                                        "{{7.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        19,
                                        "client_slug_mismatch_for_deployment_key",
                                        140,
                                        filt(
                                            "slug_miss_key_hit",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "notexist"),
                                                    cond(
                                                        "{{5.body}}", "text:equal", "[]"
                                                    ),
                                                    cond(
                                                        "{{6.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{1.client_slug}}", "exist"
                                                    ),
                                                    cond(
                                                        "{{7.body}}", "text:equal", "[]"
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        20,
                                        "client_id_row_deployment_key_mismatch",
                                        200,
                                        filt(
                                            "id_hit_key_miss",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "exist"),
                                                    cond(
                                                        "{{5.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond(
                                                        "{{1.deployment_key}}", "exist"
                                                    ),
                                                    cond(
                                                        "{{6.body}}", "text:equal", "[]"
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    conflict(
                                        21,
                                        "client_id_row_client_slug_mismatch",
                                        260,
                                        filt(
                                            "id_hit_slug_miss",
                                            [
                                                [
                                                    cond("{{1.client_id}}", "exist"),
                                                    cond(
                                                        "{{5.body}}",
                                                        "text:notequal",
                                                        "[]",
                                                    ),
                                                    cond("{{1.client_slug}}", "exist"),
                                                    cond(
                                                        "{{7.body}}", "text:equal", "[]"
                                                    ),
                                                ]
                                            ],
                                        ),
                                    ),
                                    # --- link paths (order: client_id → deployment_key → slug) ---
                                    {"flow": link_by_id},
                                    {"flow": link_by_key},
                                    {"flow": link_by_slug},
                                    # --- create only when nothing high-confidence resolved ---
                                    {"flow": create_modules},
                                ],
                            },
                        ]
                    },
                ],
            },
        ],
    }


def collect_ids(nodes: list, out: list[int]) -> None:
    for node in nodes:
        if "id" in node:
            out.append(node["id"])
        for route in node.get("routes", []):
            collect_ids(route.get("flow", []), out)


def static_route_proof(blueprint: dict) -> dict:
    """Extract filter names / outcomes for static verification evidence."""
    proofs = {
        "replay": False,
        "created": False,
        "linked_client_id": False,
        "linked_deployment_key": False,
        "linked_client_slug": False,
        "identity_conflict": False,
        "review_required": False,
        "no_create_on_conflict_filters": [],
    }
    filter_names: set[str] = set()
    bodies: list[str] = []

    def walk(nodes):
        for n in nodes:
            fl = (n.get("filter") or {}).get("name")
            body = (n.get("mapper") or {}).get("body", "") or ""
            if fl:
                filter_names.add(fl)
            if body:
                bodies.append(body)
            if fl == "replay" or '"outcome":"replayed"' in body:
                proofs["replay"] = True
            if fl == "create_new" or '"outcome":"created"' in body:
                proofs["created"] = True
            if fl == "link_by_client_id":
                proofs["linked_client_id"] = True
            if fl == "link_by_deployment_key":
                proofs["linked_deployment_key"] = True
            if fl == "link_by_client_slug":
                proofs["linked_client_slug"] = True
            if '"outcome":"identity_conflict"' in body:
                proofs["identity_conflict"] = True
                if fl:
                    proofs["no_create_on_conflict_filters"].append(fl)
            if '"outcome":"review_required"' in body:
                proofs["review_required"] = True
            for r in n.get("routes", []):
                walk(r.get("flow", []))

    walk(blueprint["flow"])
    blob = "\n".join(bodies)
    required_filters = {
        "create_new",
        "link_by_client_id",
        "link_by_deployment_key",
        "link_by_client_slug",
        "client_id_miss",
        "key_slug_disagree",
        "multi_client_slug",
        "replay",
    }
    missing_f = sorted(required_filters - filter_names)
    if missing_f:
        raise AssertionError(f"static proof missing filters: {missing_f}")
    for needle in (
        '"outcome":"created"',
        '"outcome":"linked"',
        '"outcome":"replayed"',
        '"outcome":"identity_conflict"',
        '"outcome":"review_required"',
        "client_id_not_found",
        "deployment_key_client_slug_disagree",
        "multiple_clients_for_client_slug",
    ):
        if needle not in blob:
            raise AssertionError(f"static proof missing body text: {needle}")
    # Never auto-link forbidden company keys via lookup qs
    text = json.dumps(blueprint, separators=(",", ":"))
    for bad in (
        '"key":"owner_email"',
        '"key":"owner_phone"',
        '"key":"business_name"',
    ):
        if bad in text:
            raise AssertionError(f"forbidden lookup present: {bad}")
    if '"key":"ghl_contact_id","value":"eq.' in text:
        raise AssertionError("ghl_contact_id must not be a company lookup key")
    if '"key":"domain","value":"eq.' in text:
        raise AssertionError("domain must not be a company lookup key")
    return proofs


def main() -> None:
    blueprint = build_blueprint()
    ids: list[int] = []
    collect_ids(blueprint["flow"], ids)
    if len(ids) != len(set(ids)):
        raise SystemExit(f"duplicate module ids: {ids}")

    proofs = static_route_proof(blueprint)
    out = ROOT / "artifacts/agent-runs/integrator/form1-create-or-link-payload.json"
    payload = {
        "scenarioId": 4852018,
        "confirmed": True,
        "description": (
            "Form 1 create-or-link; contract 0.2.0 / schema 1.1.0; inactive; "
            "match order client_id>deployment_key>client_slug"
        ),
        "blueprint": blueprint,
        "_static_proofs": proofs,
    }
    out.write_text(json.dumps(payload, indent=2) + "\n")

    # Preserve / refresh before snapshot from last known good create-only blueprint
    before_src = (
        ROOT / "artifacts/agent-runs/integrator/20260731T201900Z-form1-blueprint-AFTER.json"
    )
    before = json.loads(before_src.read_text())
    (
        ROOT
        / "artifacts/agent-runs/integrator/20260731T203000Z-form1-create-or-link-BEFORE.json"
    ).write_text(
        json.dumps(
            {
                "captured_at_utc": "20260731T203000Z",
                "note": (
                    "Rollback source: last known-good create-only 0.2.0/1.1.0 blueprint. "
                    "Live scenario was found webhook-only after interrupted apply; "
                    "this file is the restore baseline before create-or-link rewrite."
                ),
                "scenario_id": 4852018,
                "isActive": False,
                "blueprint": before["blueprint"],
            },
            indent=2,
        )
        + "\n"
    )
    print("ids", sorted(ids))
    print("proofs", json.dumps(proofs, indent=2))
    print("wrote", out)


if __name__ == "__main__":
    main()
