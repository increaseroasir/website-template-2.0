# GHL → Meta offline CAPI (stage webhooks)

**ONBOARDING_REQUIRED** before this works on a client:

1. Cloudflare secrets: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_OFFLINE_WEBHOOK_SECRET`
2. GHL location custom fields (exact keys):
   - `fbp`
   - `fbc`
   - `meta_event_id`
   - `event_source_url`
   - `external_id`
   - `store_pixel_id`
3. Website lead forms already persist those fields on contact create/update.
4. Workflow below pointing at `https://{{CLIENT_WEBSITE_URL}}/api/meta-offline`

## Event map (template defaults)

| Opportunity stage (example) | `event_name` | Default value | `action_source` |
|---|---|---|---|
| (website form) | `Lead` | **0** | `website` |
| Qualified | `QualifiedLead` | 75 | `system_generated` |
| Booked | `Schedule` | 300 | `system_generated` |
| Showed | `Showed` | 600 | `system_generated` |
| Won | `Purchase` | **actual sale $** | `system_generated` |

Website `/book/` also fires CAPI `Schedule` when an appointment is created.

## Workflow template (build in GHL UI)

```
Trigger: Opportunity Stage Changed

IF stage = Qualified
  → Custom Webhook POST {{site_url}}/api/meta-offline
    Headers: Authorization: Bearer {{META_OFFLINE_WEBHOOK_SECRET}}
    Body:
    {
      "event_name": "QualifiedLead",
      "email": "{{contact.email}}",
      "phone": "{{contact.phone}}",
      "first_name": "{{contact.first_name}}",
      "last_name": "{{contact.last_name}}",
      "fbp": "{{contact.fbp}}",
      "fbc": "{{contact.fbc}}",
      "meta_event_id": "{{contact.meta_event_id}}",
      "event_source_url": "{{contact.event_source_url}}",
      "external_id": "{{contact.external_id}}",
      "contact_id": "{{contact.id}}"
    }

IF stage = Booked
  → same webhook, "event_name": "Schedule"  (omit value → uses META_VALUE_SCHEDULE)

IF stage = Showed
  → "event_name": "Showed"

IF stage = Won
  → "event_name": "Purchase", "value": {{opportunity.monetary_value}}
```

Replace stage names to match the snapshot pipeline. Custom field merge keys must match the field keys created above (GHL UI labels can differ; **keys** must be exact).

## Security

- Never put `META_CAPI_ACCESS_TOKEN` in GHL.
- Rotate `META_OFFLINE_WEBHOOK_SECRET` per client.
- Endpoint returns 503 with `ONBOARDING_REQUIRED` if secrets are missing.

## Verify

1. Submit a website lead → contact has `fbp` / `fbc` / `meta_event_id` populated (when Pixel cookies present).
2. Move opportunity to Qualified → Events Manager shows `QualifiedLead` with `action_source = system_generated`.
3. Confirm Event Match Quality after a few offline events with fbp/fbc present.
