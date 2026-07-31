import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createMockStore,
  applyFormSubmission,
  computeApprovalReadiness,
  ContractError,
  newId,
} from "../../scripts/lib/factory-contract/index.mjs";

describe("Form 1/2/3 merge (mocked, no live GHL/Make)", () => {
  /** @type {ReturnType<typeof createMockStore>} */
  let store;

  beforeEach(() => {
    store = createMockStore();
  });

  it("Form1 creates client_id + onboarding_case_id once", () => {
    const first = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-1",
      payload: {
        trading_name: "Lakeview Spas",
        owner_name: "Pat Lee",
        owner_email: "pat@example.com",
        owner_phone: "+15551234567",
        offer_summary: "In-stock hot tubs",
        ghl_contact_id: "ghl_c_1",
        ghl_opportunity_id: "ghl_o_1",
      },
    });
    assert.equal(first.ok, true);
    assert.equal(first.idempotent, false);
    assert.ok(first.client_id);
    assert.ok(first.onboarding_case_id);
    assert.equal(store.clients.size, 1);
    assert.equal(store.onboarding_cases.size, 1);
    assert.equal(store.intake_submissions.size, 1);
  });

  it("duplicate Form1 (same submission_id) is idempotent", () => {
    const envelope = {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-dup",
      payload: {
        business_name: "Lakeview Spas",
        owner_name: "Pat Lee",
        owner_email: "pat@example.com",
        owner_phone: "+15551234567",
        offer_summary: "In-stock hot tubs",
        ghl_contact_id: "ghl_c_dup",
        ghl_opportunity_id: "ghl_o_dup",
      },
    };
    const first = applyFormSubmission(store, envelope);
    const second = applyFormSubmission(store, envelope);
    assert.equal(second.idempotent, true);
    assert.equal(second.result.client_id, first.client_id);
    assert.equal(second.result.onboarding_case_id, first.onboarding_case_id);
    assert.equal(store.clients.size, 1);
    assert.equal(store.onboarding_cases.size, 1);
    assert.equal(store.intake_submissions.size, 1);
  });

  it("duplicate Form1 with same opportunity reuses one logical case", () => {
    const a = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-a",
      payload: {
        business_name: "Prairie Tubs",
        owner_name: "Alex",
        owner_email: "a@example.com",
        owner_phone: "+15550001111",
        offer_summary: "Deal",
        ghl_contact_id: "ghl_c_2",
        ghl_opportunity_id: "ghl_o_shared",
      },
    });
    const b = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-b",
      payload: {
        business_name: "Prairie Tubs",
        owner_name: "Alex",
        owner_email: "a@example.com",
        owner_phone: "+15550001111",
        offer_summary: "Deal",
        ghl_contact_id: "ghl_c_2",
        ghl_opportunity_id: "ghl_o_shared",
      },
    });
    assert.equal(b.client_id, a.client_id);
    assert.equal(b.onboarding_case_id, a.onboarding_case_id);
    assert.equal(store.onboarding_cases.size, 1);
  });

  it("allows out-of-order Form3 before Form2 on the same case", () => {
    const f1 = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-oo-1",
      payload: {
        business_name: "Order Spas",
        owner_name: "Sam",
        owner_email: "s@example.com",
        owner_phone: "+15550002222",
        offer_summary: "Offer",
        ghl_contact_id: "ghl_c_oo",
        ghl_opportunity_id: "ghl_o_oo",
      },
    });

    const f3 = applyFormSubmission(store, {
      form: "form3",
      schema_version: "1.0.0",
      submission_id: "sub-oo-3",
      client_id: f1.client_id,
      onboarding_case_id: f1.onboarding_case_id,
      expected_version: f1.config_version,
      payload: {
        ga4_id: "G-TEST123",
        meta_pixel_id: "1234567890",
        ghl_location_id: "loc_abc",
        access_meta_bm: true,
        access_ga4: true,
        access_cloudflare: true,
      },
    });
    assert.equal(f3.ok, true);
    assert.equal(f3.config_version, f1.config_version + 1);

    const f2 = applyFormSubmission(store, {
      form: "form2",
      schema_version: "1.0.0",
      submission_id: "sub-oo-2",
      client_id: f1.client_id,
      onboarding_case_id: f1.onboarding_case_id,
      expected_version: f3.config_version,
      payload: {
        website_url: "https://www.orderspas.example",
        domain: "www.orderspas.example",
        dns_provider: "cloudflare",
        dns_owner: "agency",
        address: "1 Main St",
        hours: "Mon-Fri 9-5",
        phone_e164: "+15550003333",
      },
    });
    assert.equal(f2.ok, true);

    const head = [...store.config_versions.values()].sort(
      (a, b) => b.config_version - a.config_version
    )[0];
    assert.equal(head.config.ga4_id, "G-TEST123");
    assert.equal(head.config.domain, "www.orderspas.example");
    assert.equal(head.config.ghl_location_id, "loc_abc");
    assert.equal(
      store.onboarding_cases.get(f1.onboarding_case_id).ghl_location_id,
      "loc_abc"
    );
  });

  it("rejects stale Form2/3 expected_version (does not overwrite newer config)", () => {
    const f1 = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-stale-1",
      payload: {
        business_name: "Stale Spas",
        owner_name: "Jo",
        owner_email: "j@example.com",
        owner_phone: "+15550004444",
        offer_summary: "Offer",
        ghl_contact_id: "ghl_c_stale",
      },
    });

    applyFormSubmission(store, {
      form: "form2",
      schema_version: "1.0.0",
      submission_id: "sub-stale-2a",
      client_id: f1.client_id,
      onboarding_case_id: f1.onboarding_case_id,
      expected_version: f1.config_version,
      payload: {
        website_url: "https://a.example",
        domain: "a.example",
        dns_provider: "other",
        dns_owner: "client",
        address: "2 Main",
        hours: "9-5",
        phone_e164: "+15550005555",
      },
    });

    assert.throws(
      () =>
        applyFormSubmission(store, {
          form: "form2",
          schema_version: "1.0.0",
          submission_id: "sub-stale-2b",
          client_id: f1.client_id,
          onboarding_case_id: f1.onboarding_case_id,
          expected_version: f1.config_version, // stale
          payload: {
            website_url: "https://b.example",
            domain: "b.example",
            dns_provider: "other",
            dns_owner: "client",
            address: "3 Main",
            hours: "10-6",
            phone_e164: "+15550006666",
          },
        }),
      (err) => err instanceof ContractError && err.code === "concurrency_conflict"
    );

    const head = [...store.config_versions.values()].sort(
      (a, b) => b.config_version - a.config_version
    )[0];
    assert.equal(head.config.domain, "a.example");
  });

  it("repeated Form3 with same submission_id is idempotent", () => {
    const f1 = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-r3-1",
      payload: {
        business_name: "Repeat Spas",
        owner_name: "Kim",
        owner_email: "k@example.com",
        owner_phone: "+15550007777",
        offer_summary: "Offer",
        ghl_contact_id: "ghl_c_r3",
      },
    });
    const envelope = {
      form: "form3",
      schema_version: "1.0.0",
      submission_id: "sub-r3-3",
      client_id: f1.client_id,
      onboarding_case_id: f1.onboarding_case_id,
      expected_version: f1.config_version,
      payload: {
        ga4_id: "G-REPEAT",
        meta_pixel_id: "999",
        ghl_location_id: "loc_r",
        access_meta_bm: true,
        access_ga4: true,
        access_cloudflare: true,
      },
    };
    const first = applyFormSubmission(store, envelope);
    const second = applyFormSubmission(store, envelope);
    assert.equal(first.idempotent, false);
    assert.equal(second.idempotent, true);
    assert.equal(
      [...store.config_versions.values()].filter(
        (r) => r.onboarding_case_id === f1.onboarding_case_id
      ).length,
      2 // form1 + one form3
    );
  });

  it("rejects secrets in Form3 payload", () => {
    const f1 = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-sec-1",
      payload: {
        business_name: "Secret Spas",
        owner_name: "Lee",
        owner_email: "l@example.com",
        owner_phone: "+15550008888",
        offer_summary: "Offer",
        ghl_contact_id: "ghl_c_sec",
      },
    });
    assert.throws(
      () =>
        applyFormSubmission(store, {
          form: "form3",
          schema_version: "1.0.0",
          submission_id: "sub-sec-3",
          client_id: f1.client_id,
          expected_version: f1.config_version,
          payload: {
            ga4_id: "G-X",
            meta_pixel_id: "1",
            ghl_location_id: "loc",
            access_meta_bm: true,
            access_ga4: true,
            access_cloudflare: true,
            capi_token: "SHOULD_NOT_BE_HERE",
          },
        }),
      (err) =>
        err instanceof ContractError && err.code === "secret_in_form_forbidden"
    );
  });

  it("approval readiness requires fields or unexpired deferrals (null is not a deferral)", () => {
    const f1 = applyFormSubmission(store, {
      form: "form1",
      schema_version: "1.0.0",
      submission_id: "sub-ar-1",
      payload: {
        business_name: "Ready Spas",
        owner_name: "Mo",
        owner_email: "m@example.com",
        owner_phone: "+15550009999",
        offer_summary: "Offer",
        ghl_contact_id: "ghl_c_ar",
      },
    });
    let readiness = computeApprovalReadiness(store, f1.onboarding_case_id);
    assert.equal(readiness.is_ready, false);
    assert.ok(readiness.missing_fields.includes("ga4_id"));
    assert.ok(readiness.missing_fields.includes("domain"));

    // Null ga4_id in config must not count; deferral required
    store.deferrals.push({
      deferral_id: newId(),
      onboarding_case_id: f1.onboarding_case_id,
      field_name: "ga4_id",
      reason: "pending access",
      approved_by: "csm@example.com",
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      launch_consequence: "tracking delayed",
      production_allowed: false,
      required_before_launch: true,
    });
    readiness = computeApprovalReadiness(store, f1.onboarding_case_id);
    assert.ok(!readiness.missing_fields.includes("ga4_id"));
    assert.ok(readiness.missing_fields.includes("domain"));
  });
});
