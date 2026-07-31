import { ContractError } from "./errors.mjs";
import { loadIdentityFields } from "./load-contract.mjs";
import { newId } from "./mock-store.mjs";

/**
 * Apply Form 1/2/3 against the mock store with idempotency + optimistic concurrency.
 * No live GHL/Make.
 *
 * @param {ReturnType<import('./mock-store.mjs').createMockStore>} store
 * @param {object} envelope
 */
export function applyFormSubmission(store, envelope, identity = loadIdentityFields()) {
  const {
    form,
    schema_version,
    submission_id,
    payload = {},
    expected_version,
    correlation_id = `corr:${submission_id}`,
    client_id: envelopeClientId,
    onboarding_case_id: envelopeCaseId,
  } = envelope ?? {};

  if (!form || !["form1", "form2", "form3"].includes(form)) {
    throw new ContractError("invalid_argument", "form must be form1|form2|form3");
  }
  if (!schema_version) {
    throw new ContractError("invalid_argument", "schema_version is required");
  }
  if (!submission_id) {
    throw new ContractError("invalid_argument", "submission_id is required");
  }

  const formDef = identity.forms[form];
  const idemKey = buildIdempotencyKey(form, formDef, payload, envelopeClientId, submission_id);

  if (store.idempotency_keys.has(idemKey)) {
    return {
      ok: true,
      idempotent: true,
      result: store.idempotency_keys.get(idemKey).result,
    };
  }

  // Duplicate submission_id for same form is also idempotent via intake unique key.
  for (const sub of store.intake_submissions.values()) {
    if (sub.form === form && sub.submission_id === submission_id) {
      const result = {
        ok: true,
        idempotent: true,
        client_id: sub.client_id,
        onboarding_case_id: sub.onboarding_case_id,
      };
      store.idempotency_keys.set(idemKey, { key: idemKey, result });
      return { ok: true, idempotent: true, result };
    }
  }

  if (form === "form1") {
    return applyForm1(store, {
      schema_version,
      submission_id,
      payload,
      expected_version,
      correlation_id,
      idemKey,
      formDef,
      identity,
    });
  }

  return applyEnrichmentForm(store, {
    form,
    schema_version,
    submission_id,
    payload,
    expected_version,
    correlation_id,
    envelopeClientId,
    envelopeCaseId,
    idemKey,
    formDef,
    identity,
  });
}

function buildIdempotencyKey(form, formDef, payload, clientId, submissionId) {
  if (form === "form1") {
    const contact = payload.ghl_contact_id || "unknown";
    return `intake:form1:${contact}:${submissionId}`;
  }
  if (!clientId) {
    return `intake:${form}:pending:${submissionId}`;
  }
  return `intake:${form}:${clientId}:${submissionId}`;
}

function applyForm1(store, ctx) {
  const {
    payload,
    submission_id,
    schema_version,
    expected_version,
    correlation_id,
    idemKey,
    formDef,
  } = ctx;

  if (!payload.ghl_contact_id) {
    throw new ContractError("invalid_argument", "ghl_contact_id is required on form1");
  }
  if (!payload.business_name && !payload.trading_name) {
    throw new ContractError("invalid_argument", "business_name is required on form1");
  }

  // Primary dedupe is submission_id; secondary logical link uses opportunity or client_slug.
  // Contact ≠ company: ghl_contact_id alone must never create-or-replace the org key.
  let client = null;
  let caseRow = null;
  let created = false;

  if (payload.ghl_opportunity_id) {
    for (const row of store.onboarding_cases.values()) {
      if (row.ghl_opportunity_id === payload.ghl_opportunity_id) {
        caseRow = row;
        client = store.clients.get(row.client_id);
        break;
      }
    }
  }

  const businessName = payload.business_name || payload.trading_name;
  const clientSlug =
    payload.client_slug ||
    slugify(businessName);

  if (!client) {
    // Do not create a second org for the same client_slug
    for (const c of store.clients.values()) {
      if (c.client_slug === clientSlug) {
        client = c;
        caseRow = store.onboarding_cases.get(c.active_onboarding_case_id) || null;
        break;
      }
    }
  }

  if (!client) {
    const client_id = newId();
    const onboarding_case_id = newId();
    const deployment_key = payload.deployment_key || `dep_${clientSlug}`;
    client = {
      client_id,
      client_slug: clientSlug,
      deployment_key,
      business_name: businessName,
      domain: payload.domain ?? null,
      ghl_contact_id: payload.ghl_contact_id,
      active_onboarding_case_id: onboarding_case_id,
      slug_locked: false,
      slug_locked_at: null,
      slug_locked_by_resource_id: null,
      slug_locked_reason: null,
    };
    caseRow = {
      onboarding_case_id,
      client_id,
      status: "submitted",
      version: 1,
      ghl_contact_id: payload.ghl_contact_id,
      ghl_opportunity_id: payload.ghl_opportunity_id ?? null,
      ghl_location_id: null,
      onboarding_schema_version: "1.0.0",
      correlation_id,
    };
    store.clients.set(client_id, client);
    store.onboarding_cases.set(onboarding_case_id, caseRow);
    created = true;
  }

  // Re-intake onto an existing case must merge onto head config and honor expected_version.
  // Starting from {} would wipe Form2/Form3 enrichment (critical defect).
  const head = headConfig(store, caseRow.onboarding_case_id);
  const headVersion = head?.config_version ?? 0;
  if (!created) {
    if (expected_version === undefined || expected_version === null) {
      throw new ContractError(
        "invalid_argument",
        "expected_version is required for Form1 re-intake on an existing case"
      );
    }
    if (expected_version !== headVersion) {
      throw new ContractError(
        "concurrency_conflict",
        `expected_version=${expected_version} but head config_version=${headVersion}`,
        { expected_version, actual_version: headVersion }
      );
    }
  }

  const config = mergeOwnedFields(
    { ...(head?.config ?? {}) },
    "form1",
    payload,
    formDef,
    ctx.identity
  );
  const configVersion = headVersion + 1;
  appendConfigVersion(store, {
    client_id: client.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    config_version: configVersion,
    config,
    source_form: "form1",
    submission_id,
    correlation_id,
  });

  const intakeId = newId();
  store.intake_submissions.set(intakeId, {
    intake_submission_id: intakeId,
    client_id: client.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    form: "form1",
    schema_version,
    submission_id,
    ghl_contact_id: payload.ghl_contact_id,
    payload,
    correlation_id,
  });

  const result = {
    ok: true,
    idempotent: false,
    client_id: client.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    config_version: configVersion,
    status: caseRow.status,
  };
  store.idempotency_keys.set(idemKey, { key: idemKey, result });
  store.workflow_events.push({
    event_type: "form1_applied",
    client_id: client.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    correlation_id,
    payload: { submission_id, config_version: configVersion },
  });
  return result;
}

function applyEnrichmentForm(store, ctx) {
  const {
    form,
    payload,
    submission_id,
    schema_version,
    expected_version,
    correlation_id,
    envelopeClientId,
    envelopeCaseId,
    idemKey,
    formDef,
    identity,
  } = ctx;

  if (formDef.forbidden_in_payload) {
    for (const banned of formDef.forbidden_in_payload) {
      if (payload[banned] !== undefined) {
        throw new ContractError(
          "secret_in_form_forbidden",
          `${banned} must not appear in form payloads`
        );
      }
    }
  }

  const caseRow = resolveEnrichmentCase(store, envelopeClientId, envelopeCaseId);
  const head = headConfig(store, caseRow.onboarding_case_id);
  const headVersion = head?.config_version ?? 0;

  if (expected_version === undefined || expected_version === null) {
    throw new ContractError(
      "invalid_argument",
      "expected_version is required for form2/form3"
    );
  }
  if (expected_version !== headVersion) {
    throw new ContractError(
      "concurrency_conflict",
      `expected_version=${expected_version} but head config_version=${headVersion}`,
      { expected_version, actual_version: headVersion }
    );
  }

  const merged = mergeOwnedFields(
    { ...(head?.config ?? {}) },
    form,
    payload,
    formDef,
    identity
  );

  // Domain audit
  if (
    form === "form2" &&
    payload.domain !== undefined &&
    store.clients.get(caseRow.client_id).domain !== payload.domain
  ) {
    const client = store.clients.get(caseRow.client_id);
    store.workflow_events.push({
      event_type: "domain_changed",
      client_id: caseRow.client_id,
      onboarding_case_id: caseRow.onboarding_case_id,
      correlation_id,
      payload: { from: client.domain, to: payload.domain },
    });
    client.domain = payload.domain;
  }

  if (form === "form3" && payload.ghl_location_id) {
    caseRow.ghl_location_id = payload.ghl_location_id;
  }

  const configVersion = headVersion + 1;
  appendConfigVersion(store, {
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    config_version: configVersion,
    config: merged,
    source_form: form,
    submission_id,
    correlation_id,
  });

  const intakeId = newId();
  store.intake_submissions.set(intakeId, {
    intake_submission_id: intakeId,
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    form,
    schema_version,
    submission_id,
    payload,
    correlation_id,
  });

  const result = {
    ok: true,
    idempotent: false,
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    config_version: configVersion,
  };
  // Rebuild key with resolved client_id
  const resolvedKey = `intake:${form}:${caseRow.client_id}:${submission_id}`;
  store.idempotency_keys.set(resolvedKey, { key: resolvedKey, result });
  if (resolvedKey !== idemKey) {
    store.idempotency_keys.set(idemKey, { key: idemKey, result });
  }

  store.workflow_events.push({
    event_type: `${form}_applied`,
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    correlation_id,
    payload: { submission_id, config_version: configVersion },
  });
  return result;
}

function resolveEnrichmentCase(store, clientId, caseId) {
  if (caseId) {
    const row = store.onboarding_cases.get(caseId);
    if (!row) throw new ContractError("not_found", "onboarding_case_id");
    return row;
  }
  if (clientId) {
    const client = store.clients.get(clientId);
    if (!client?.active_onboarding_case_id) {
      throw new ContractError("not_found", "active onboarding case");
    }
    return store.onboarding_cases.get(client.active_onboarding_case_id);
  }
  throw new ContractError(
    "invalid_argument",
    "form2/form3 require onboarding_case_id or client_id"
  );
}

function headConfig(store, onboardingCaseId) {
  let head = null;
  for (const row of store.config_versions.values()) {
    if (row.onboarding_case_id !== onboardingCaseId) continue;
    if (!head || row.config_version > head.config_version) head = row;
  }
  return head;
}

function nextConfigVersion(store, onboardingCaseId) {
  return (headConfig(store, onboardingCaseId)?.config_version ?? 0) + 1;
}

function appendConfigVersion(store, row) {
  const id = newId();
  store.config_versions.set(id, { config_version_id: id, ...row });
}

/**
 * Merge using per-field ownership policies.
 * Null/undefined incoming values do not clear.
 * A writer may only set fields it is allowed to own; global form precedence
 * never lets form3 overwrite form1-owned fields it does not own.
 */
export function mergeOwnedFields(base, form, payload, formDef, identity) {
  const out = { ...base };
  const fieldMeta = formDef.fields;
  const policies = identity.field_policies || {};

  for (const [field, meta] of Object.entries(fieldMeta)) {
    let value = payload[field];
    if (field === "business_name" && value === undefined && payload.trading_name) {
      value = payload.trading_name;
    }
    if (value === undefined || value === null) continue;

    const policy = policies[field] || {
      owner: meta.owner || form,
      allowed_writers: [meta.owner || form],
      precedence: [meta.owner || form],
    };

    if (!policy.allowed_writers.includes(form)) {
      throw new ContractError(
        "writer_not_allowed",
        `${form} cannot write field ${field} outside its ownership contract`
      );
    }

    const existingOwner = out.__owners?.[field];
    if (existingOwner && existingOwner !== form) {
      if (existingOwner === "human_override") {
        // Human overrides outrank forms; forms must not overwrite them.
        continue;
      }
      const precedence = policy.precedence || identity.merge_rules.owner_precedence;
      const existingRank = precedence.indexOf(existingOwner);
      const incomingRank = precedence.indexOf(form);
      if (existingRank !== -1 && incomingRank !== -1 && existingRank < incomingRank) {
        continue;
      }
      // Even with higher global form precedence, do not write fields owned by another form.
      if (policy.owner && policy.owner !== form && existingOwner === policy.owner) {
        // same owner field — allow if writer permitted
      }
      if (policy.owner && !policy.allowed_writers.includes(form)) {
        throw new ContractError(
          "writer_not_allowed",
          `${form} cannot overwrite ${field} owned by ${policy.owner}`
        );
      }
    }

    out[field] = value;
    out.__owners = { ...(out.__owners || {}), [field]: form };

    if (policy.client_scoped && out.__client_scope && payload.__foreign_client_id) {
      if (payload.__foreign_client_id !== out.__client_scope) {
        throw new ContractError(
          "cross_client_leakage",
          `${field} is client-scoped and cannot leak across clients`
        );
      }
    }
  }

  // Reject attempts to smuggle non-owned known policy fields via payload extras.
  for (const field of Object.keys(payload)) {
    if (field === "trading_name" || field.startsWith("__")) continue;
    if (fieldMeta[field]) continue;
    if (
      form === "form1" &&
      ["client_slug", "deployment_key", "domain"].includes(field)
    ) {
      continue;
    }
    const policy = policies[field];
    if (policy && !policy.allowed_writers.includes(form)) {
      throw new ContractError(
        "writer_not_allowed",
        `${form} cannot write field ${field} outside its ownership contract`
      );
    }
  }

  // Allow non-owned passthrough identity links on form1
  if (form === "form1") {
    for (const key of ["ghl_contact_id", "ghl_opportunity_id", "client_slug", "deployment_key"]) {
      if (payload[key] !== undefined && payload[key] !== null) {
        out[key] = payload[key];
      }
    }
  }

  return out;
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "client";
}

export function computeApprovalReadiness(store, onboardingCaseId, identity = loadIdentityFields()) {
  const head = headConfig(store, onboardingCaseId);
  const config = head?.config ?? {};
  const now = Date.now();
  const activeDeferrals = store.deferrals.filter(
    (d) =>
      d.onboarding_case_id === onboardingCaseId &&
      new Date(d.expires_at).getTime() > now
  );
  const missing = [];
  const deferralsUsed = [];

  for (const field of identity.approval_required_fields) {
    const present = config[field] !== undefined && config[field] !== null && config[field] !== "";
    if (present) continue;
    const deferral = activeDeferrals.find((d) => d.field_name === field);
    if (deferral) {
      deferralsUsed.push(deferral.deferral_id);
      continue;
    }
    missing.push(field);
  }

  const openSync = store.sync_failures.filter(
    (f) => f.onboarding_case_id === onboardingCaseId && !f.resolved_at
  );

  return {
    is_ready: missing.length === 0 && openSync.length === 0,
    missing_fields: missing,
    deferrals_used: deferralsUsed,
    blocking_sync_failures: openSync.map((f) => f.sync_failure_id),
  };
}
