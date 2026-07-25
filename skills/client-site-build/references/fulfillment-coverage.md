# Coverage matrix — `manus-fulfillment-skills.md` → certified skill pack

Generated 2026-07-24 (Module C). **Skill wins contradictions.**

| # | Capability (narrative doc) | Status | Where covered / resolution |
|---|---|---|---|
| 1 | Orchestrator trigger + route skills | **COVERED** | `manus-skills/dealer-site-orchestrator/SKILL.md` |
| 1b | `client.fulfillment.json` as plan file | **CONTRADICTION** | Skill uses `clients/<name>/client.config.js` + `intake.json` + `tokens.env` as the plan (`--validate`). Schema file may remain for legacy checks; do not require fulfillment.json for launch. |
| 2 | Intake questions / onboarding form | **COVERED** | `dealer-site-intake` + `references/intake-sheet-mapping.md` + `CLIENT_INTAKE_SHEET.csv` + brief path |
| 2b | Ask for brand colors / retheme | **CONTRADICTION** | Law 3 + decision-table: palette is the product — escalate, do not retheme per client. |
| 3 | Clone template → CF Pages + D1 + R2 + secrets | **COVERED** (closed gap) | `dealer-site-launch/references/provisioning-checklist.md` + repo `wrangler.toml` / `npm run db:init:*` |
| 4 | Tracking setup (GA4/Pixel/Clarity/attribution/CAPI) | **COVERED** | `dealer-site-wiring/references/wiring.md` IDs 1–3, 11–13; `tracking.manifest.json` + `verification.checklist.md` at repo root |
| 5 | GHL fields/tags + test lead + Sheets vault | **COVERED** / partial | GHL: wiring #4–5, `npm run ghl:fields:*`, launch-checklist cellular lead. **Sheets Lead Vault:** repo scripts may exist; treat as optional agency tooling — not a launch blocker if `/api/lead`→GHL works (skill ruling). |
| 6 | Inventory + admin smoke | **COVERED** (closed gap) | Repo `npm run admin:smoke`; launch-checklist inventory gate; provisioning D1/R2 |
| 7 | Verification / launch gate | **COVERED** | `gate.mjs` + `launch-checklist.md` + `npm run launch:check` / `ga4:funnel` |
| 8 | Client handoff doc | **COVERED** (closed gap) | `dealer-site-launch/references/handoff-template.md` |
| — | Rush / sheet intake | **COVERED** | Module A/B — not in original narrative; now in intake + orchestrator |
| — | Meta offline CAPI funnel | **COVERED** | Module E — wiring 11–13, launch-checklist, `docs/GHL_META_OFFLINE_WORKFLOW.md` |

## Contradictions log (skill wins)

1. **Plan artifact:** `client.fulfillment.json` → superseded by `client.config.js` / `intake.json` / `tokens.env`.  
2. **Brand colors per client:** narrative asks; skill forbids (Law 3).  
3. **Sheets Lead Vault required for launch:** narrative implies required; skill = GHL lead path is the zero-defect path; Sheets is additive.
