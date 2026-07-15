<!--
EXEMPLAR — Ideagen formal release notes (real, from Ideagen Luminate help centre).
Source: "Ideagen Quality Management Professional 7.10.1 release notes", help.ideagen.com, 2026-07.
Use as few-shot for the RELEASE-NOTES artifact. This is the LONGER, formal help-centre format
that the newsletter highlight links out to — distinct from the punchy comms newsletter.

Structure to imitate:
  - "Who is this article for?" audience line (+ access/permissions note)
  - One-paragraph summary of the whole release
  - ## Features — each feature: ### heading, then HOW IT WORKS in calm, precise prose
    (mechanism explained, not just benefit; no marketing adjectives)
  - ## Fixes — a "Highlighted fix" called out in prose, then an "Other fixes" reference table
    (Reference ID + Description; note hotfix provenance where relevant)
  - ## Known issues — honest, each with cause + workaround + "fix in an upcoming release"
Voice: neutral, precise, administrator-facing, British spelling, full product names, no hype.
-->

# Ideagen Quality Management Professional 7.10.1 release notes

**Who is this article for?**
Administrators considering implementation of Ideagen Quality Management 7.10.1. No special access or permissions are required.

Ideagen Quality Management 7.10.1 introduces a new collaborative draft document review integration with Ideagen Please Review, along with improvements to how user deletion from Mazlan Home is handled, performance improvements and a range of resolved issues across Documents, Occurrences, CA/PA and Audit modules.

## Features

### Draft Review — Ideagen Please Review Integration
The iFrame integration with Ideagen Please Review enables collaborative document reviews during the draft stage, allowing document owners to invite participants to review a draft document directly within Ideagen Please Review, without leaving Ideagen Quality Management. This functionality is available when both Ideagen Quality Management and PleaseReview are integrated with Ideagen Hub.

This works by creating a Draft Review in Ideagen Quality Management; the document's primary (indexed) attachment in Word format is automatically sent to Ideagen Please Review where participants can add comments and annotations collaboratively. Once the review is complete, the document is automatically checked back in to Ideagen Quality Management and the review is completed in Ideagen Please Review.

### Delete Event — Ideagen Mazlan Home integration
Ideagen Quality Management now improves the handling of user deletion events from Ideagen Mazlan Home (formerly Ideagen Hub). When a user is deleted or removed from Mazlan Home, Ideagen Quality Management automatically archives the affected user across all assigned Ideagen Quality Management instances.

This release also enhances the user sync matching behaviour to correctly handle scenarios where a newly created Hub user shares the same username or email address as a previously deleted user. Archived user records are now uniquely marked at the point of deletion to ensure future sync events are matched to the correct identity, preventing unintended inheritance of workload assignments and linked data from the archived record.

### Web service enhancement
We enhanced the CreateNewAudit web service to include additional fields — Lead Auditor and Scope Items.

## Fixes

### Highlighted fix
**Windows client concurrency issue** — Some customers experienced errors and slowdowns when multiple users were saving or updating records at the same time on the Windows client. This has been fixed by adjusting how the Windows client handles database transactions, bringing it in line with how the Web client already works. Users should experience fewer errors and better performance during periods of high concurrent usage.

### Other fixes
| Reference | Description |
|---|---|
| QPL-35903 | Fixed issues with multiple users being unable to access a document record. Released as a hotfix in v7.10.0.1. |
| QPL-35781 | Fixed issues with the filter builder for Workflow Status in CA/PA stages. Released as a hotfix in v7.10.0.1. |
| QPL-35904 | Fixed post-migration issues with Ideagen Hub causing repeated MFA prompts on the Windows client. Released as a hotfix in v7.10.0.1. |
| QPL-35905 | Fixed post-migration issues with Ideagen Hub causing repeated MFA prompts due to missing Device ID passthrough. Released as a hotfix in v7.10.0.1. |
| QPL-32107 | Fixed issue with customised labels not updating in Web. |
| QPL-33471 | Fixed issue with saving searches in the Occurrence module. |
| QPL-35865 | Fixed performance issues in the Occurrence list view with dynamic person fields. |
| QPL-35866 | Fixed issue with advanced workload reassignment not working as expected. |
| QPL-36028 | Fixed server error issues on check in/out activation in the Document module. |
| QPL-36042 | Fixed issue with missing workload items in the modern UI. |
| QPL-36226 | Fixed issue with the Audit Log Viewer installer writing incorrect DataPortal URLs. |
| QPL-36355 | Fixed crashing issues with the Windows client when creating, saving, or sharing Advanced Search folders in Assets and CA/PA modules. |
| QPL-36419 | Fixed crashing issues when attempting to save a search folder after applying a filter in the CA/PA module. |
| QPL-36453 | Fixed server error when selecting targeted attendees. |

## Known issues

### Login redirect loop when accessing draft review iFrame
Users may be redirected to the login page repeatedly when accessing the Draft Review iFrame. This occurs when third-party cookies are blocked at the browser level, which prevents the iFrame from loading correctly.

We are working on a fix in an upcoming release. In the meantime, unblock third-party cookies in your browser (Apple Safari, Google Chrome, Microsoft Edge, Mozilla Firefox).
