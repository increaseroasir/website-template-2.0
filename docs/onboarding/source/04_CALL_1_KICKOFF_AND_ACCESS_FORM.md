# Form 4 — Call 1 Kickoff and Access Form

## Audience and timing

CSM-only. Complete live. Target Call 1 within 2 business days after Form 1 is complete. Submit before ending the call.

## Prefilled identity

HTL Client ID, Onboarding Case ID, Legal Business Name, Primary Domain, Client Slug.

## Call context fields

- Call Date: date, required
- CSM: user dropdown, required
- Client Attendees: repeatable people, required
- Decision Maker Present: yes/no, required

## Business confirmation fields

Use required checkboxes:
- Business Information Confirmed
- Location Information Confirmed
- Campaign Context Confirmed
- Lead Routing Confirmed
- Appointment Availability Confirmed

If unchecked, require notes and create blocker.

## Website decision tree

Website status dropdown:
- live_access_verified
- live_access_pending
- previous_agency_controls
- ownership_unclear
- no_website
- under_construction

If no website, the CSM must:
1. Confirm desired domain.
2. Confirm whether the client owns it.
3. Record registrar.
4. Record who controls DNS.
5. Mark website build as an HTL deliverable.
6. Do not request website-admin access.
7. Create blocker only if domain ownership is unresolved.

Conditional fields:
- desired_domain
- domain_registered
- registrar_name
- registrar_access_status
- dns_access_status
- website_build_required

## Meta setup decision tree

Meta Business Portfolio status:
- exists_client_owned_verified
- exists_client_owned_unverified
- previous_agency_owned
- ownership_unclear
- does_not_exist
- client_account_restricted

If no portfolio exists, the CSM must:
1. Have the client owner use their real personal Facebook profile.
2. Never create a fake/shared profile.
3. Create the client’s Facebook Business Page if missing.
4. Create a client-owned Meta Business Portfolio.
5. Add the Page.
6. Create a client-owned ad account.
7. Confirm timezone and currency before creation.
8. Have the client add their own payment method during screen share.
9. Create or connect the Pixel/Dataset if required.
10. Add HTL as a partner using the approved Business ID.
11. Assign only required assets.
12. Confirm at least one client-side admin remains.

Required Meta fields:
- Facebook Page Status: dropdown
- Business Portfolio Status: dropdown
- Ad Account Status: dropdown
- Billing Status: dropdown
- Pixel/Dataset Status: dropdown
- HTL Partner Access: dropdown
- Client Admin Confirmed: yes/no

## Other access statuses

Use universal access status dropdowns for:
- Google account
- Google Business Profile
- Hosting
- Domain and DNS
- Existing CRM
- Phone provider
- POS
- Inventory system

## Risks and blockers

- Previous Agency Access Risk: dropdown
- Open Access Issues: repeatable blocker objects
- Access Approved: approved / approved_with_blockers / not_approved

Do not allow approved if any required access is pending or blocked.

## Positioning and creative

- Primary Positioning: paragraph
- Priority Products and Brands: tags
- Priority Offers: tags
- Key Differentiators: tags
- Primary CTA: dropdown
- Prohibited Topics or Claims: tags
- Advertising Approval Owner: person
- Creative Direction Notes: paragraph

CTA options:
shop_inventory / book_appointment / request_pricing / claim_offer / call_store / visit_showroom / other

## Evidence

Use evidence status dropdowns for:
- inventory
- offers
- financing
- testimonials
- awards
- permission for people pictured

If missing or unsupported:
- require unsupported claim
- require owner
- require due date
- require evidence needed

## Wrap-up

- Employee Access Form Status
- Client Commitments
- HTL Commitments
- Call 2 Scheduled
- Call 2 Date/Time
- Kickoff Outcome Summary
- Recommended Status Transition

## CSM hard stops

- Never accept passwords.
- Never let HTL own client assets.
- Never let a previous agency remain the only admin.
- Never mark access verified without seeing it.
- Never mark evidence verified without a source.
- Never end the call without owners and deadlines for blockers.
