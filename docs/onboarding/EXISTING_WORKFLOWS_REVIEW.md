# Existing Workflow Review (read-only)

Location: Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`. **Do not activate or modify.**

## GHL published workflows

| Name | ID | Trigger (inferred) | Purpose | Side effects | Overlap | Recommendation |
|---|---|---|---|---|---|---|
| Store Onboarding \| Tag on Form Completion \| v1 | `ba425b5b-5c19-4c24-9aba-d0e9829b4098` | Store Onboarding form submit | Tag contact | Tag `store-onboarding-form-completed` | Partial — single legacy form | **Replace** eventually with product-form-specific tags; leave untouched until cutover |
| Store Onboarding \| Submission Thank You SMS \| v1 | `911a6bcf-1568-45a0-bb78-d18aa94b011d` | Form submit | Client thank-you SMS | SMS send | Reminder/confirm channel | **Reuse pattern**; rewrite for new forms later |
| Store Onboarding \| Send Service Agreement Contract \| v1 | `57118a4c-ec5d-43e0-a2b8-e80b9a5de285` | Onboarding process | Send contract | Document/contract send | Outside optimized five-form core | **Leave untouched**; keep as parallel legal track |
| Notify Test Form \| Internal SMS Notification \| v1 | `cd3d6559-7618-41f7-9c1d-8c2bcbfab8d9` | Notify Test Form | Internal SMS | SMS to staff | Test harness | **Leave untouched** (test) |

Fields used: Store Onboarding contact custom fields (exact module mapping not expanded; deep step export deferred). Tags: `store-onboarding-form-completed` and follow-up tags exist.

## Make

| Scenario | ID | Active | Recommendation |
|---|---|---|---|
| HTL Factory Form 1 Intake (dev_test) | `4852018` | **false** | Documented prototype against `epeddfdifckzzmskhdsz`. **Do not activate** in design freeze. Revisit after contract-delta + capacity cleanup |
| Onboarding Scenario (DWY) 2nd Version | `1856850` | false | Soft name risk — **do not reuse** |

Make org: 26 active / 43 total — capacity pressure before any later live create.

**Disposition of the parallel Make branch/stash:** see [`PARALLEL_MAKE_LANE_RECONCILIATION.md`](./PARALLEL_MAKE_LANE_RECONCILIATION.md). IDs above are read-only inventory only. `EXECUTION_STATE` still marks P2 Make as not authorized — do not treat this section as implementation complete.

## Pipelines

None in this location — CRM Testing milestones must create/verify pipeline later (P3+/fulfillment), not invent here.
