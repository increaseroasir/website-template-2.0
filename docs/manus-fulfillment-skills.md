# Manus Fulfillment Skills For Dealer Websites

These skill specs turn the website template into a repeatable fulfillment system. The goal is simple: a user can say, "I need a website for XYZ company," and Manus can collect the right information, configure every system, verify tracking, and hand off a launched client website.

## Skill 1: Website Fulfillment Orchestrator

### Trigger

Use this skill when the user asks for a new dealer website, for example:

- "I need a website for XYZ Spas."
- "Build a client site from the hot tub template."
- "Start fulfillment for a new dealer."

### First Response

Ask one question:

> Do you already have the onboarding form, or do you want to answer the setup questions here?

Offer two choices:

1. Upload or paste onboarding form.
2. Guided setup questions.

### Responsibilities

- Create or update `client.fulfillment.json`.
- Validate it against `client.fulfillment.schema.json`.
- Route work to the specialized skills below.
- Never deploy until the Verification Skill passes.
- Keep a running missing-information list.

### Output

- `client.fulfillment.json`
- Missing fields summary
- Next skill to run

## Skill 2: Client Intake

### Inputs

- Uploaded onboarding form, pasted notes, or answers from guided setup.
- `client.fulfillment.schema.json`

### Required Questions

Ask only for missing required values:

- Company name, legal name, market, timezone
- Phone, address, hours, map URL
- Domain and DNS owner
- Brand colors, logo URL, voice notes
- Primary offer, financing promise, delivery promise
- Products sold
- Cloudflare account/project preferences
- GA4 ID and property ID
- Meta Pixel ID and CAPI token availability
- Microsoft Clarity ID
- GHL location ID and API token availability
- Google Sheets Lead Vault ID
- Admin password owner
- Alert email and handoff recipients

### Rules

- Do not ask all questions if an onboarding form already answers them.
- Do not accept vague placeholders like "later" for required fields.
- If a secret is unavailable, record who will set it and stop before launch verification.

### Output

- Valid or partially valid `client.fulfillment.json`
- Missing required fields list
- Secrets list with owner

## Skill 3: Repository And Cloudflare Provisioning

### Inputs

- `client.fulfillment.json`
- Public template repo: `https://github.com/ssaofficial/website-template-2.0`

### Responsibilities

- Clone the public template into a new client repo.
- Fill `client.config.js`.
- Fill `wrangler.toml`.
- Create or link Cloudflare Pages project.
- Create D1 database and bind it as `DB`.
- Create R2 bucket and bind it as `PRODUCT_IMAGES`.
- Apply `functions/db/schema.sql` to D1.
- Set required Cloudflare variables and secrets.
- Run `npm run placeholder:check` and block if unresolved deploy tokens remain.
- Deploy preview branch only.

### Stop Conditions

Stop and report if:

- Template repo is not public.
- Cloudflare account access is missing.
- D1 or R2 cannot be created.
- Required secrets are unavailable.
- Placeholder scan still finds client tokens after config.

### Output

- Client repo URL
- Cloudflare preview URL
- D1 database name and ID
- R2 bucket name
- Secrets checklist with set/missing status

## Skill 4: Tracking Setup

### Inputs

- `client.fulfillment.json`
- `tracking.manifest.json`
- Client preview URL

### Responsibilities

- Confirm `assets/tracking.js` loads GA4, Meta Pixel, and Clarity with client IDs.
- Confirm `assets/traffic-attribution.js` captures UTM, fbclid, gclid, msclkid, landing page, referrer, and traffic channel.
- Confirm `assets/lead-form.js` sends `meta_event_id`, `_fbp`, `_fbc`, UTM fields, lead source, campaign, and page URL.
- Confirm `functions/lib/meta-capi.js` sends server `Lead` with matching `event_id`.
- Confirm `assets/call-tracking.js` fires phone click events.
- Confirm `assets/pricing-tracking.js` fires pricing click events.

### Events Required Before Launch

Use `tracking.manifest.json` as the source of truth. At minimum verify:

- GA4 `page_view`
- GA4 `generate_lead`
- GA4 `click_call`
- GA4 `pricing_click`
- Meta Pixel `PageView`
- Meta Pixel `ViewContent`
- Meta Pixel `Lead`
- Meta CAPI `Lead`
- Clarity session
- Clarity `call_click`
- Clarity `pricing_click`

### Output

- Tracking proof report
- Any missing event list
- Recommendation to continue or block launch

## Skill 5: GHL And Lead Routing

### Inputs

- `client.fulfillment.json`
- Preview URL
- GHL API token and location ID
- Google Sheets ID and service account credentials

### Responsibilities

- Verify GHL connection.
- Verify or create required custom fields from the manifest.
- Run `npm run ghl:fields:check`; if approved, run `npm run ghl:fields:create` to create missing fields.
- Verify required tags exist or can be applied.
- Verify Google Sheets Lead Vault write access.
- Submit a controlled test lead.
- Confirm product-page test leads are enriched from the D1 product record before GHL upsert.
- Confirm the lead path:
  - Website form
  - `/api/lead`
  - Google Sheets Lead Vault
  - GHL contact upsert
  - Meta CAPI
- Confirm failed-GHL path writes Missed Leads and triggers alerting when feasible.

### Required CRM Fields

Use `tracking.manifest.json.crmCustomFields` as the source of truth.

### Required Tags

Verify:

- `src-meta`
- `src-organic`
- `src-inbound-call`
- `Campaign - {campaign}`
- `Intent - {form_intent}`
- `Model Interest - {product_name}`
- Inventory status tags
- `productlead`

### Output

- Test lead submission ID
- Lead Vault row proof
- GHL contact URL
- Tags and fields proof
- Meta CAPI event ID

## Skill 6: Inventory And Admin

### Inputs

- `client.fulfillment.json`
- D1 database
- R2 bucket
- Admin credentials

### Responsibilities

- Apply D1 schema.
- Seed inventory from the manifest, CSV, or admin entry.
- Confirm `/api/inventory` returns public products.
- Confirm category pages pull inventory correctly.
- Confirm active inventory index loads.
- Confirm product detail page loads by slug.
- Confirm product lead forms carry product context.
- Confirm `/admin` login works.
- Confirm product create/edit/hide/delete flows.
- Confirm image upload writes to R2 and produces a public URL.
- Run `npm run admin:smoke` against the preview URL with `ADMIN_PASSWORD`; run with `ADMIN_SMOKE_MUTATE=1` when authorized to create a hidden smoke product and mark it deleted.

### Output

- Admin URL
- Inventory API proof
- Product page proof
- R2 upload proof

## Skill 7: Verification And Launch Gate

### Inputs

- `verification.checklist.md`
- `tracking.manifest.json`
- Preview URL
- Client repo
- Cloudflare project
- GHL and Sheets access

### Responsibilities

- Run every required line in `verification.checklist.md`.
- Run `npm run launch:check` against local config and again with `LAUNCH_CHECK_URL` after preview deploy.
- Run `npm run admin:smoke` after preview deploy.
- Run `npm run ga4:funnel` after test events have had time to appear in GA4.
- Produce a pass/fail report with evidence.
- Block production launch if any zero-defect item fails.
- Deploy production only after verification passes.
- Re-run critical checks on production URL after launch.

### Output

- Launch proof report
- Production URL
- Verification pass/fail status
- Known limitations

## Skill 8: Client Handoff

### Inputs

- Launch proof report
- Production URL
- Admin URL
- GHL contact proof
- Tracking proof

### Responsibilities

- Create a client-friendly handoff document.
- Include admin login instructions without exposing passwords in plain text.
- Include how to add/edit inventory.
- Include what tracking is connected.
- Include support escalation instructions.
- Include final URLs.

### Output

- Client handoff document
- Agency internal proof document

## Standard Fulfillment Flow

1. Orchestrator starts from a single user request.
2. Intake creates `client.fulfillment.json`.
3. Repository and Cloudflare skill provisions infrastructure.
4. Tracking skill connects and verifies browser/server tracking.
5. GHL and Lead Routing skill verifies CRM and Sheets.
6. Inventory and Admin skill verifies products and images.
7. Verification skill blocks or approves production launch.
8. Client Handoff skill packages proof and instructions.

## Non-Negotiables

- Do not deploy production before preview passes verification.
- Do not call the site launched if the lead path fails.
- Do not call tracking finished without Meta Pixel, Meta CAPI, GA4, Clarity, and attribution proof.
- Do not reuse another client's IDs, copy, images, or secrets.
- Do not expose secret values in handoff docs.
- Do not leave unresolved `{{PLACEHOLDER}}` tokens in public files.
