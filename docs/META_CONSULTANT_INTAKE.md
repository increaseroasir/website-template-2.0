# Meta Consultant Intake — Answer After Reading the Brief

**Prerequisite:** You must read [`META_PIXEL_AND_CAPI.md`](./META_PIXEL_AND_CAPI.md) first.  
**Purpose:** Turn “optimize Meta / get better leads” into concrete decisions and build requests.  
**Rules for answers:** Every item needs a **specific** answer. Use the formats in brackets. Do not answer with slogans (“better creative,” “improve quality”) unless you also specify the event, number, or change.

Fill this in and return it to the site owner.

---

## A. Confirm you understood the current setup

Copy each line and replace `___` with your confirmation.

1. Primary optimization event today should be: `___`  
   *(Expected if you agree with the brief: `Lead` with Pixel + CAPI dedupe.)*

2. Booking page currently sends to Meta: `___`  
   *(Expected: Pixel `Schedule` only — no CAPI.)*

3. Phone taps currently send to Meta: `___`  
   *(Expected: Pixel `Contact` only — click, not answered call.)*

4. Default lead value wired today: `$___` `___` currency  
   *(Expected from brief unless account was customized: `$950` `USD`.)*

5. CAPI user_data fields available today (list): `___`

If any of 1–5 disagree with the brief, quote the brief section and explain why before continuing.

---

## B. Campaign optimization — be specific

6. **Optimization event for prospecting campaigns**  
   - Event name Meta should optimize for: `___`  
   - Bid strategy (e.g. Lowest cost, Cost cap $X, ROAS target X): `___`  
   - Why this event over alternatives on this site: `___`

7. **Optimization event for retargeting campaigns**  
   - Event / audience definition: `___`  
   - Window (e.g. ViewContent 7 days, PageView 30 days): `___`  
   - Bid strategy: `___`

8. **Do you want `Schedule` (showroom booking) as an optimization event?**  
   - Yes / No: `___`  
   - If Yes: optimize on Pixel-only now, or require CAPI + shared `event_id` before spending: `___`  
   - If Yes: recommended event name Meta should see (`Schedule` vs `Lead` with content_name): `___`

9. **Do you want phone calls as an optimization event?**  
   - Yes / No: `___`  
   - If Yes: is Pixel `Contact` on click acceptable, or do you require call-tracking verified connects: `___`  
   - If verified connects: which call-tracking stack (name the product): `___`

---

## C. Lead value & quality — numbers required

10. **Recommended `LEAD_VALUE` for this account**  
    - Dollar amount: `$___`  
    - How you calculated it (formula + inputs): `___`  
    - Revisit cadence (e.g. every 30 days): `___`

11. **Should lead value differ by form type?**  
    - Yes / No: `___`  
    - If Yes, fill the table:

| Lead type | Example source | Recommended value ($) |
|---|---|---|
| Homepage / general form | | |
| Product / model page form | | |
| Financing interest | | |
| Showroom booking (`/book/`) | | |
| Other (specify) | | |

12. **CRM-stage / offline events you want sent via CAPI**  
    Rank and define. Leave blank only if you explicitly do not want offline events.

| Priority (1 = first) | Event name for Meta | CRM stage / definition of when it fires | Estimated volume / week |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

13. **Duplicate / quality rules**  
    Today we suppress Meta `Lead` for ~24h email/phone duplicates and for failed CRM writes.  
    - Keep as-is / change: `___`  
    - If change: exact new rule: `___`

---

## D. Matching & technical upgrades — yes/no + priority

For each row: **Do now / Later / Never**, and if Do now, state priority 1–5 (1 = highest).

| Upgrade | Do now / Later / Never | Priority (1–5) | Notes / acceptance criteria |
|---|---|---|---|
| Add hashed first/last name to CAPI `user_data` | | | |
| Add city / state / zip to CAPI when available | | | |
| Pixel Advanced Matching from form fields | | | |
| CAPI for `Schedule` (booking) with shared `event_id` | | | |
| CAPI for `ViewContent` (server) | | | |
| CAPI / better signal for calls | | | |
| Offline CAPI (qualified / showed / sold) | | | |
| Differentiated lead values by form type | | | |
| Custom conversions or custom events (name them in notes) | | | |

14. **Minimum Event Match Quality (EMQ) target** you will hold the account to: `___` / 10  
    What you will check weekly in Events Manager: `___`

---

## E. Audiences & exclusions — specifics only

15. **Prospecting exclusions** (list exact audience definitions):  
    - `___`  
    - `___`

16. **Retargeting audiences to build** (name + rule + window):  
    - `___`  
    - `___`  
    - `___`

17. **Lookalike / advantage+ guidance** (if any): seed event or audience + size / country: `___`

---

## F. Build requests for the engineering team

Only list work that requires a code or env change. Each line must be implementable.

18. **Must build before next spend increase**

| # | Change | Acceptance test (how we prove it in Events Manager / Test Events) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

19. **Nice-to-have later**

| # | Change | Why it waits |
|---|---|---|
| 1 | | |
| 2 | | |

20. **Env / account checklist you need confirmed live today**

| Item | Required value / status | Who owns it |
|---|---|---|
| Pixel ID matches browser + CAPI | | |
| CAPI access token valid | | |
| Test Event Code (if using) | | |
| `LEAD_VALUE` / currency set to your recommendation | | |
| Domain verified in Events Manager | | |
| Aggregated Event Measurement / priority config | | |

---

## G. Sign-off

21. Consultant name: `___`  
22. Date: `___`  
23. One-sentence summary of the single highest-ROI change for this site: `___`  
24. Estimated impact if #23 is done (e.g. “+X% qualified leads” or “−$Y CPL”) with the assumption stated: `___`

---

### Owner note (not for the consultant to skip)

If this intake comes back without filled numbers, event names, and a prioritized build table, send it back. The brief already documents the stack — the job of this file is decisions, not restating Meta theory.
