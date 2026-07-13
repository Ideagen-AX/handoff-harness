import type { Artifact } from "./types";

// Suggested recipients per audience — placeholders the sender confirms. These are
// NOT resolved against a directory (that would need the Outlook/Graph integration,
// which is intentionally stubbed until auth is sorted).
const AUDIENCE_TO: Record<string, string> = {
  "design-system": "design-system@ideagen.com",
  "product-docs": "docs@ideagen.com",
  "support-summary": "support@ideagen.com",
  qa: "qa@ideagen.com",
  "release-notes": "releases@ideagen.com",
  "analytics-plan": "insights@ideagen.com",
  "one-pager": "product-comms@ideagen.com",
  "case-study": "product-comms@ideagen.com",
  slide: "product-comms@ideagen.com",
  dev: "engineering@ideagen.com",
  "dev-code": "engineering@ideagen.com",
};

export type EmailDraft = { to: string; subject: string; body: string };

// STUB: composes the email a real Outlook/Graph send would use. Sending is not
// wired (blocked on M365 auth) — we produce a draft the user sends manually.
export function composeDraft(artifact: Artifact, changeTitle?: string): EmailDraft {
  const subjectTail = changeTitle ? `: ${changeTitle}` : "";
  return {
    to: AUDIENCE_TO[artifact.audienceId] ?? "",
    subject: `[Design handoff] ${artifact.label}${subjectTail}`,
    body:
      `Hi,\n\nHere is the ${artifact.label.toLowerCase()} for an upcoming change, for your review.\n\n` +
      `${artifact.content}\n\n` +
      `— Sent from the Design Handoff Harness (draft; please review before acting).`,
  };
}

// Serialise a draft as an RFC-822 .eml the user can open in Outlook and send.
export function toEml(draft: EmailDraft, dateISO: string): string {
  const headers = [
    `To: ${draft.to}`,
    `Subject: ${draft.subject}`,
    `Date: ${dateISO}`,
    "X-Unsent: 1", // Outlook opens this as an editable draft
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
  ];
  return `${headers.join("\r\n")}\r\n\r\n${draft.body.replace(/\n/g, "\r\n")}`;
}
