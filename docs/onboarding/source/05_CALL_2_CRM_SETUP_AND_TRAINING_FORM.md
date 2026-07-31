# Form 5 — Call 2 CRM Setup and Team Training Form

## Audience and timing

CSM-only. Complete live. Employee forms are due by 12:00 PM local time, 1 business day before Call 2. Submit before ending the call. Default retest deadline is 1 business day.

## Identity and call context

Prefill:
- HTL Client ID
- Onboarding Case ID
- Submitted By
- Call Date
- CSM
- Attendees

## Employee access verification

| Label | Type | Required |
|---|---|---|
| Expected Employees | number | Yes |
| Employees Provisioned | number | Yes |
| Employee Login Test | test_result dropdown | Yes |
| Permission Test | test_result dropdown | Yes |
| Required Role Test | test_result dropdown | Yes |
| Employee Access Notes | paragraph | Conditional |

Rule: provisioned count must equal expected count unless approved exception exists.

## Lead routing tests

- Test Lead Submitted: checkbox
- Test Lead Source: dropdown
- Lead Assignment Test: test_result
- Assigned Employee: user dropdown
- Routing Delay Seconds: number
- Routing Notes: conditional paragraph

Lead source options:
website_form / facebook_lead_ad / manual_test / chat / phone / other

## Communication tests

Use test_result dropdowns for:
- SMS sending
- SMS receiving
- Email sending
- Email receiving
- Notification delivery

Every fail/block requires reason, owner, and retest date.

## Appointment and pipeline tests

- Test Appointment Booked
- Correct Calendar Confirmed
- Appointment Notifications Test
- Pipeline Update Test
- Correct Pipeline Selected
- Correct Initial Stage Selected
- Opportunity Owner Correct

## Phone and AI tests

- Inbound Call Test
- Outbound Call Test
- AI Voice Secretary Test
- Call Recording Disclosure Verified
- Voicemail/Fallback Test

## Compliance gates

A2P Carrier Registration:
- approved
- submitted
- pending_client
- rejected
- not_required

Contact-List Opt-In:
- verified
- mixed_or_unclear
- failed
- not_applicable

Contact-List Import Approval:
- approved
- approved_partial
- pending
- rejected
- not_required

Do not import contacts when opt-in is mixed, unclear, or failed.

## Training

- Training Attendees: repeatable people
- Lead Response Training: test_result
- Opportunity Update Training: test_result
- Calendar Training: test_result
- SMS/Email Training: test_result
- Manager Reporting Training: conditional test_result
- Training Questions: paragraph
- Training Outcome: passed / passed_with_follow_up / failed / reschedule_required

## Wrap-up

- Open Issues
- Client Commitments
- HTL Commitments
- Retest Scheduled
- Retest Date
- Call 2 Outcome Summary
- Recommended Status Transition

## CSM hard stops

- Do not pass if required tests are untested.
- Do not import lists without verified consent.
- Do not mark training complete if required employees were absent.
- Do not advance if login, routing, or communications fail without approved exception.
