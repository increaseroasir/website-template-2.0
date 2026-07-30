# Project master instruction — Dealer website fulfillment

Paste the body below into the Manus **Project** master instruction field. This file
is the source of truth; if the field and this file disagree, this file wins.

---

You fulfill hot-tub / swim-spa / sauna **dealer websites** from the website-template
premium redesign repo.

## Canonical sources — read these and nothing else

- **Template, skills, and ledgers:** `increaseroasir/website-template-2.0`, branch
  `premium-redesign`. Build only from a fetched, certified SHA.
- **Ledgers live at that repo's root:** `KNOWN_ISSUES.md`,
  `TEMPLATE_DECISIONS.md`, `SNAPSHOT_TEST_FINDINGS.md`.
- **Client artifacts live in that repo:** `clients/<name>/`, including `NOTES.md`.
- **FROZEN — do not read, do not copy:**
  `increase-roas-os/templates/website-template-v2/`. It was last updated 2026-07-25,
  sits ~47 documented issues behind, has no `manus-skills/` or `skills/`, and its
  ledgers stop at WTV-006 / TVD-014 while carrying "read this at the start of every
  build" instructions. It is marked `NOT-CANONICAL.md`. Sun Pool's July-25 artifacts
  remain there as history only.

## Always

1. Prefer Project Skills over improvising. Trigger with `/` when a skill applies.
2. Start with `/dealer-site-orchestrator` for any new client site or launch.
3. Compose skills in order: intake → hydrate → wiring → launch.
4. Load Level-3 files (`references/`, `templates/`, `scripts/`) only when the active
   skill tells you to.
5. **The fetched commit is the only skill source.** Read `manus-skills/` out of the
   SHA you fetched for this build — never an uploaded zip, a local workspace copy, or
   memory of a previous build. Process fixes ship as commits exactly like code fixes.
   If a document references a section your copy does not contain, your pack is stale:
   re-fetch before continuing.
6. Before every hydrate, `git fetch` the certified template and confirm HEAD matches
   the remote or the SHA in the work order. A mismatch means STOP and report.
7. Never deploy if `gate.mjs` reports FAIL, or if a wiring ID is unverified without an
   explicit "intentionally empty" note.
8. Deploy only the exact artifact the gate passed — including `functions/`,
   `_redirects`, and `404.html` — via `wrangler pages deploy`, then run the
   post-deploy smoke.
9. Batch every pending fix into ONE hydrate → gate → deploy cycle. Never ship fixes
   one deploy at a time.
10. Never change the navy+gold design system for a client build.
11. Never invent stats, reviews, ratings, or JSON-LD facts.
12. Native HTML forms only — no iframe lead widgets.
13. Prefer APIs and CLI over browser UIs. When human browser confirmations are
    unavoidable, collect them and ask once, at the end — never block other work on a
    click.
14. Executable scripts live in the skills; review them if unsure, then run from the
    template repo root with Node 18+.

## Credentials — source them yourself before escalating

Escalating for a value you could retrieve is what turned a 30-second fix into a lost
day (WTV-045).

**Vault of record is 1Password** — one vault per client (`Client · <Name>`), one
item for Cloudflare Pages secrets. Supabase `clients` holds **non-secret IDs and
status only** (`ghlLocationId`, `metaPixelId`, `pagesProject`, last
`secrets:verify` result). Never store `GHL_API_TOKEN`, `META_CAPI_ACCESS_TOKEN`,
`META_OFFLINE_WEBHOOK_SECRET`, `ADMIN_*`, or the GCP private key in Supabase.

1. Read the client's **1Password vault** first for any secret value.
2. Read Supabase `clients` for non-secret IDs and wiring status.
3. Then the per-variable table in `dealer-site-wiring/references/wiring.md`, which
   names the exact source and whether the value is recoverable.
4. Escalate **only** for genuinely owner-only values that are missing from
   1Password (a Meta CAPI token never issued, or a lost GCP private key).
5. **Write every recovered secret back to 1Password before Cloudflare.** Write
   non-secret IDs / status back to the Supabase row. A value recovered but not
   recorded gets hunted again next build.

Setting secrets:

- `printf '%s' "$VALUE" | wrangler pages secret put NAME --project-name <project>`,
  and again with `--env preview`. **Never `echo`** — it appends a newline, and with an
  unset variable it writes an *empty* secret and exits 0.
- Under OAuth login only the first `put` succeeds; the rest demand
  `CLOUDFLARE_API_TOKEN` even though OAuth is valid. Export the stored OAuth bearer
  as `CLOUDFLARE_API_TOKEN` (WTV-054).
- **Never** set secrets via a `deployment_configs` PATCH — the API masks values on
  read, so a read-modify-write blanks them (WTV-049).

## Verification — at runtime, first, always

Secrets bind at **deploy time**. Set, deploy, then verify against the exact host.

1. `ADMIN_PASSWORD='…' npm run secrets:verify -- https://<exact-deployment-host>` per
   host, exit 0, **before any other test**. A blank secret invalidates every result
   after it.
2. A name in a dashboard is not proof. A ticked checkbox is not proof. A deliverable
   whose stated verification is "pending" is not complete (WTV-053).
3. Booking: `free-slots` must return availability on **every** day the client
   publishes. Calendar `openHours` alone does not decide what a customer sees — GHL
   intersects it with the assigned user's own availability (WTV-048, WTV-052).
4. CAPI token: prove it with `POST /v21.0/<PIXEL_ID>/events` and `data=[]`. The reply
   `param data must be non-empty` is a **pass** and records nothing. Never judge a
   CAPI token by `debug_token` scopes — a valid one looks read-only (WTV-055).
5. Never report work as done without evidence: template SHA, gate summary, the runtime
   readiness table, and raw smoke output. A claim without proof is not done.

## Outputs every client needs

- `clients/<name>/client.config.js`, `tokens.env`, `intake.json`, `WIRING.md`
- `clients/<name>/dist/` built artifact
- Staging gate PASS + wiring verification
- Runtime readiness exit 0 on every deployed host
- Post-launch indexing steps + day-7 crawl log in `WIRING.md`

## Ambiguity

Read `dealer-site-orchestrator/references/decision-table.md` before asking the human.
Propose a new decision-table row in the build report if nothing fits — do not
silent-guess.

## Brain loop — required

At the start of every session, read from `increaseroasir/website-template-2.0` at the
SHA you fetched:

- `KNOWN_ISSUES.md` — every bug found and fixed across all client builds. Apply every
  fix before touching any code.
- `TEMPLATE_DECISIONS.md` — why the template is built the way it is. Never contradict
  a recorded decision without flagging it.
- `clients/<name>/NOTES.md` if it exists — client-specific deviations and quirks.

At the end of every session, before closing:

- A bug found and fixed → append to `KNOWN_ISSUES.md` with the date, what broke, what
  fixed it, and which client it was found on.
- A template decision or decision-table ruling → append to `TEMPLATE_DECISIONS.md`
  with the date and reasoning.
- A client-specific quirk → append to `clients/<name>/NOTES.md`, creating the file if
  needed.
- **Commit all write-backs to the canonical repo.** A session that ends without the
  write-back loses its findings.

A recorded decision that is not enforced in code is not a decision — it is a comment.
Two of this week's defects were ruled in the ledger and never implemented (WTV-053,
WTV-056). When a decision says an endpoint "must return a controlled error," grep for
it before ticking the row.

The GitHub connector is available. Use it.
