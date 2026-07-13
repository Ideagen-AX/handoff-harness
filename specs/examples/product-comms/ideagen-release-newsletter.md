<!--
EXEMPLAR — Ideagen cross-pillar product-release newsletter (real, lightly cleaned).
Source: "Big week for Product releases - across ALL pillars", SharePoint news post, 2026-07-13.
Use as few-shot for the feature-highlight / product-comms artifact. Imitate its VOICE and
STRUCTURE, not its specific products. Note the per-product block shape:
  Product + version → punchy subtitle → one-line framing → 3–6 feature bullets
  (each: bold benefit-led lead, then one plain-language sentence of what it does & for whom)
  → PM attribution → link to full release notes.
-->

# Big week for Product releases - across ALL pillars

A landmark week for quality management. Ideagen Quality Management Professional 7.10.1 delivers the long-awaited Please Review integration, bringing collaborative document reviews directly into the quality workflow for the first time. Elsewhere, Mazlan Home 10.0.0 ships Home Realm Discovery and multilingual UI support, Ideagen EHS Priya 26.3 cuts manual steps for field workers, Ideagen Policy Logic publishes its 2026 CompliLearn courses, and Ideagen Collaboration Portal Desktop gets a ground-up rebuild with v5.0.

⬇️ Highlights below ⬇️

---

## Ideagen Quality Management Professional 7.10.1
### Please Review integration and Mazlan Home user handling

A focused release adding collaborative draft document reviews and improving user management across integrated products.

- **Draft review integration with Ideagen Please Review** — Document owners can now invite participants to collaboratively review draft documents directly within Ideagen Please Review, without leaving Ideagen Quality Management. Once complete, the document is automatically checked back in.
- **Improved user deletion handling from Mazlan Home** — When a user is deleted from Mazlan Home, Ideagen Quality Management automatically archives them across all assigned instances, with smarter sync matching to prevent unintended data inheritance.
- **Windows client concurrency fix** — Resolved errors and slowdowns when multiple users saved or updated records simultaneously, bringing Windows client behaviour in line with the web client.

*Jeena Stephen — Product Manager. Read the release notes.*

---

## Ideagen EHS Priya 26.3
### Mobile location preference, action item due date defaults, and chemical synonym search

Three focused updates improving field usability, reporting accuracy, and chemical identification.

- **Mobile location preference** — Field workers can now set their default location directly in Mobile Pro, synced bidirectionally with the web platform and persisted across sessions and devices.
- **Default action item due date offset** — Configurable offset (0 to 365 days) pre-populates due dates on creation, reducing artificially inflated overdue counts in management reports. Works across web and Mobile Pro, including offline.
- **Extended chemical synonym search** — Chemical Library in App Builder now exposes Synonym 2, 3, and 4 fields, so users can find chemicals using any of their available names.

*Ravi Ranjan — Product Manager. Read the release notes.*

---

## Mazlan Home 10.0.0
### Home Realm Discovery, multilingual UI, and CSV import improvements

A significant release improving the login experience, accessibility, and admin tooling for large and international organisations.

- **Home Realm Discovery** — Users enter their email address and Mazlan Home automatically routes them to the right identity provider, replacing the confusing multi-IDP login list for large multi-instance tenants.
- **Multilingual UI (Beta)** — Mazlan Home is now available in French, Italian and Spanish, alongside UK and US English, with language set per user via Admin Console or Profile Settings.
- **CSV import enhancements** — Inline field guidance with required and optional column labels, plus an improved import history showing file names, uploading admin, and re-downloadable files.
- **Audit trail timestamps in local time zone** — PDF audit trail reports now show timestamps in the requesting user's configured time zone rather than UTC.
- **MFA improvements** — Admins can now reset passwords for MFA-enabled users via a temporary password flow, with cleaner MFA settings visibility for SSO users.

Also includes Regulatory Intelligence widget updates with French, Italian, and Spanish translation support, plus fixes to display name handling, role management, and automated user import.

*SueAnn See — Product Manager.*

---

## Ideagen Policy Logic
### 2026 CompliLearn courses now available

The 2026 editions of Ideagen's Learning courses are now live in the CompliLearn portal, updated for legislative and regulatory changes and improved learner engagement.

- **Updated for 2026 requirements** — Courses reflect the latest legislative and regulatory changes across Corporate, Financial Services, and Not-for-Profit content catalogues.
- **Improved learner experience** — New interactive elements including sorting activities, knowledge checks, and audio files to make content more accessible.
- **Records maintenance** — New course editions allow organisations to maintain complete historical records of learning assigned to staff across previous years.

Courses are available now in the CompliLearn portal via the Go1 Learn search menu. Search "2026" to find and add courses based on your subscription.

*Cara Novakovic — Head of Legal and Regulatory Content.*

---

## Ideagen Collaboration Portal Desktop v5.0
### Ground-up rebuild for Windows and macOS

A major modernisation of the desktop client, rebuilt from scratch for a faster, more reliable experience on both platforms.

- **Rebuilt on modern technology** — React-based UI and latest .NET runtime delivering faster load times and smoother interactions.
- **Refreshed interface** — Windows 11 Fluent Design on Windows, with a consistent and clean cross-platform look on macOS.
- **All core features retained** — Open, edit, upload, browse workspaces, recent files, bookmarks, and search all work as before.
- **Stronger security** — OAuth 2.0 authentication and code-signed installers on both Windows and macOS.

No downtime. No migration needed. Files are stored securely in the cloud.

*Majid Latif — Product Manager. Read the release notes.*
