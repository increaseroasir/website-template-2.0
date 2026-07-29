# DNS Cutover — putting the site on the client's own domain

This is the last step of a launch and the only one that is visible to the client's
customers the moment it lands. It is also the only step where a mistake takes the
business offline, or takes its **email** offline, which is worse.

Read this before touching a DNS record. Run the commands; do not assume the
current state, because almost every client arrives with a different one.

---

## The shape of the problem

Nearly every dealer we take over is on a shared host (SiteGround, GoDaddy,
Bluehost) that is also handling their email. That produces three constraints:

1. **The apex cannot be a CNAME.** `example.com` must be an `A`/`ALIAS` record.
   Only `www.example.com` can CNAME to `<project>.pages.dev`. So unless you move
   nameservers to Cloudflare, **`www` is the canonical host** and the apex 301s to
   it. Every canonical tag, sitemap URL, and JSON-LD `url` must agree.
2. **The MX records are load-bearing.** They are usually pointed at the host's
   spam filter, not at the mail provider directly. Moving nameservers to
   Cloudflare means recreating MX, SPF, DKIM, and DMARC by hand, and a missed
   record silently stops the client's mail. Default to **leaving DNS where it is**
   and changing only `www`.
3. **TTL sets the schedule, not you.** A record with an 86400-second TTL is cached
   by resolvers for up to 24 hours. Flipping it "now" means a day of some visitors
   on the old site and some on the new one, with leads landing in two places.

---

## Step 0 — Observe, before deciding anything

```bash
DOMAIN=example.com

echo "--- who controls DNS ---";      dig +short NS   $DOMAIN
echo "--- apex ---";                  dig +short A    $DOMAIN
echo "--- www ---";                   dig +short A    www.$DOMAIN
                                      dig +short CNAME www.$DOMAIN
echo "--- www TTL (the schedule) ---"; dig www.$DOMAIN A | awk '/^www/{print $2" s"}'
echo "--- email, do not break ---";   dig +short MX   $DOMAIN
dig +short TXT $DOMAIN | grep -i spf
```

Write the output into `WIRING.md` before you change anything. If the cutover has
to be rolled back, this is the only record of what the values were.

**Decide from the NS line:**

| `NS` says | Do this |
|---|---|
| the old host (siteground/godaddy/…) | Leave DNS there. Change only `www`. Apex 301s via the host's redirect tool. This is the default. |
| Cloudflare already | Add both apex and `www` as Pages custom domains; Cloudflare CNAME-flattens the apex, so no redirect is needed. |
| a registrar with no redirect feature | Moving nameservers to Cloudflare may be the only option. Then you **must** migrate MX/SPF/DKIM/DMARC first and verify mail flow before cutting the web records. |

---

## Step 1 — Attach the hostname in Pages first

Attach the custom domain **before** DNS points at it. Cloudflare will hold it at
`status=pending` until the record resolves, which is exactly what you want: the
certificate is provisioned and waiting, so there is no gap between DNS
propagating and HTTPS working.

```bash
ACCT=<cloudflare-account-id>
PROJECT=<pages-project>

curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCT/pages/projects/$PROJECT/domains" \
| python3 -m json.tool
```

Expect `"status": "pending"` for `www.<domain>`. Attaching the **apex** while DNS
lives elsewhere will fail validation and sit there forever — do not attach it
unless Cloudflare is authoritative for the zone.

---

## Step 2 — Lower the TTL, then wait a full day

In the host's DNS editor, edit the existing `www` record and set TTL to the lowest
value offered (usually 300 or 600 seconds). **Change nothing else.** Then wait
24 hours — or however long the *old* TTL was — so caches holding the old value
expire.

This is the step everyone skips, and it is the reason a cutover that "worked" still
generates a day of phone calls about the old site.

Use the wait productively: verify the `www` property in Google Search Console
(verification survives the cutover, so doing it early removes a task from the
critical path), and confirm `CLIENT_WEBSITE_URL` in `tokens.env` is the **www**
form and has been rebuilt through. A canonical tag pointing at the apex while the
apex 301s to `www` teaches Google that every page is a redirect.

---

## Step 3 — Cut over

Two changes, in this order:

1. **Delete** the `www` `A` record pointing at the old host.
2. **Create** a CNAME: name `www`, target `<project>.pages.dev`, TTL low.

Then, in the host's control panel, add a **301 redirect** from the apex to
`https://www.<domain>`, preserving the path. In SiteGround this is Site Tools →
Domain → Redirects. A redirect that drops the path sends every indexed deep link
to the homepage and discards the ranking each one earned.

Leave the apex `A` record, all `MX` records, and the SPF/DKIM/DMARC `TXT` records
exactly as they are. The apex `A` must keep resolving, because the host cannot
serve the redirect for a domain that does not point at it.

---

## Step 4 — Verify, in this order

```bash
DOMAIN=example.com

echo "--- www now resolves to Pages ---"
dig +short CNAME www.$DOMAIN

echo "--- www serves the site (expect 200, server: cloudflare) ---"
curl -sI https://www.$DOMAIN/ | grep -iE '^(HTTP/|server)'

echo "--- apex redirects to www, path preserved (expect 301 + /hot-tubs/) ---"
curl -sI https://$DOMAIN/hot-tubs/ | grep -iE '^(HTTP/|location)'

echo "--- Pages domain went active ---"
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCT/pages/projects/$PROJECT/domains" \
| python3 -c "import json,sys
for d in json.load(sys.stdin).get('result') or []:
    print(f\"  {d['name']}: {d['status']}\")"

echo "--- EMAIL STILL WORKS: MX unchanged from Step 0 ---"
dig +short MX $DOMAIN
```

**The failure that takes the site down:** if `www` and the apex both redirect at
each other, every request loops and nothing loads. It happens when the apex
redirect is added while something on the Pages side still sends `www` to the apex.
The two `curl -sI` calls above catch it in seconds — one must be `200` and the
other `301`. Never a `301` on both.

Then, and only then:

- [ ] Submit the sitemap in Search Console for the **www** property
- [ ] `indexnow --submit <domain>` (never against staging)
- [ ] Re-run `npm run secrets:verify -- https://www.<domain>` against the live host
- [ ] Submit a real lead on the live domain and confirm it reaches both the CRM and
      the Lead Vault. A deployment can be perfect and still fail here, because
      Pages binds environment variables per deployment (WTV-047).
- [ ] Record the cutover date and the pre-change DNS values in `WIRING.md`

---

## Rollback

Recreate the `www` `A` record with the value captured in Step 0 and remove the
apex redirect. Because the TTL was lowered in Step 2, this takes effect in minutes
rather than a day — which is the second reason that step is not optional.

---

## Worked example — Sun Pool & Spa Supply, 2026-07-29

Observed state: `NS` = `ns1/ns2.siteground.net`; apex and `www` both `A` →
`35.215.101.30`; `www` TTL **86400**; `MX` → `mx10/20/30.antispam.mailspamprotection.com`.

Decision: DNS stays at SiteGround. Moving nameservers would mean rebuilding the
spam-filter MX chain for no gain, so `www` becomes canonical and the apex 301s to
it. `www.sunpoolandspasupply.com` is attached to the `sun-pool-spa` Pages project
at `status=pending`, waiting on the CNAME. The apex was attached earlier, could
never validate, and was removed — correctly.

`CLIENT_WEBSITE_URL` was `https://sunpoolandspasupply.com` and was changed to the
`www` form, which must be rebuilt through before cutover so canonicals, sitemap,
and JSON-LD all name the host that actually serves the site.
