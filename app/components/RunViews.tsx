"use client";

import { marked } from "marked";
import type { ChangeBrief, Capture, InstrumentationPlan } from "@/lib/types";
import { EXPORT_ORDER, EXPORT_LABEL, exportsFor, codeExt, type ArtifactLike, type Exporters } from "@/app/lib/exports";

// Review packages — artifacts are grouped into these tabs by id/prefix, so the
// ~15 drafts read as a small set of deliverables. Shared by the generator and
// the library run view (via RunTabs).
export const PACKAGES = [
  { id: "design", title: "Design system", ids: ["design-system"], prefixes: ["component-"] },
  { id: "eng", title: "Engineering", ids: ["dev", "dev-code"], prefixes: [] },
  { id: "qa", title: "QA", ids: ["qa"], prefixes: [] },
  { id: "docs", title: "Documentation & support", ids: ["product-docs", "support-summary", "release-notes"], prefixes: [] },
  { id: "comms", title: "Executive comms", ids: ["one-pager", "slide"], prefixes: [] },
  { id: "story", title: "Case study", ids: ["case-study"], prefixes: [] },
  { id: "analytics", title: "Analytics & success", ids: ["analytics-plan"], prefixes: [] },
  { id: "other", title: "Other", ids: [] as string[], prefixes: [] as string[] },
];
export function packageFor(audienceId: string): string {
  const p = PACKAGES.find((pkg) => pkg.ids.includes(audienceId) || pkg.prefixes.some((pre) => audienceId.startsWith(pre)));
  return p ? p.id : "other";
}

export type TabArtifact = ArtifactLike & { approved?: boolean };

// ── One artifact, with its per-output export row ─────────────────────────────
// Editable (generator) shows a textarea + Approve/Copy; read-only (library)
// renders the Markdown. Both show the export buttons appropriate to the output.
export function ArtifactCard({
  artifact,
  framework,
  exporters,
  editable = false,
  approved = false,
  onToggleApprove,
  onEdit,
  onCopy,
}: {
  artifact: ArtifactLike;
  framework: string;
  exporters: Exporters;
  editable?: boolean;
  approved?: boolean;
  onToggleApprove?: () => void;
  onEdit?: (content: string) => void;
  onCopy?: () => void;
}) {
  const caps = exportsFor(artifact.audienceId);
  return (
    <div className={`card artifact ${approved ? "approved" : ""}`}>
      <div className="artifact-head">
        <h3>{artifact.label}</h3>
        {approved && <span className="approved-tag">✓ Approved</span>}
      </div>
      {editable ? (
        <textarea value={artifact.content} onChange={(e) => onEdit?.(e.target.value)} />
      ) : (
        <div className="md" dangerouslySetInnerHTML={{ __html: marked.parse(artifact.content, { async: false }) as string }} />
      )}
      <div className="btn-row" style={{ marginTop: 10 }}>
        {editable && (
          <button className={approved ? "" : "primary"} onClick={onToggleApprove}>
            {approved ? "Unapprove" : "Approve"}
          </button>
        )}
        {editable && (
          <button className="ghost" onClick={onCopy}>
            Copy
          </button>
        )}
        {EXPORT_ORDER.filter((cap) => caps.includes(cap)).map((cap) => (
          <button key={cap} className="ghost" onClick={() => exporters.run(cap, artifact)}>
            {cap === "js" ? `.${codeExt(framework)}` : EXPORT_LABEL[cap]}
          </button>
        ))}
        {caps.includes("email") && (
          <span className="meta">
            Email is stubbed — downloads a draft .eml to send from Outlook
            {artifact.audienceId === "slide" ? " (with the .pptx attached)" : ""}.
          </span>
        )}
      </div>
    </div>
  );
}

// ── Instrumentation plan (Gainsight data-ids) ────────────────────────────────
export function InstrumentationPanel({ plan }: { plan: InstrumentationPlan }) {
  return (
    <details className="card brief" open>
      <summary>Instrumentation · {plan.points.length} data-id{plan.points.length === 1 ? "" : "s"} for Gainsight</summary>
      <p className="meta" style={{ margin: "8px 0 12px" }}>
        These <code>data-id</code> selectors are documented in the analytics plan and wired into the coded
        component so Gainsight PX has a unique element to attach to.
      </p>
      <table className="instr-table">
        <thead>
          <tr><th>data-id</th><th>Element</th><th>Event</th><th>Metric</th></tr>
        </thead>
        <tbody>
          {plan.points.map((p) => (
            <tr key={p.dataId}>
              <td><code className="screenkey">{p.dataId}</code></td>
              <td>{p.element}</td>
              <td><span className="pill ok">{p.event}</span></td>
              <td>{p.metric}<div className="meta">{p.note}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// ── Captured screens gallery ─────────────────────────────────────────────────
export function CaptureGallery({
  captures,
  onDownloadOne,
  onDownloadAll,
}: {
  captures: Capture[];
  onDownloadOne: (c: Capture) => void;
  onDownloadAll: () => void;
}) {
  const ok = captures.filter((c) => c.ok).length;
  return (
    <details className="card brief" open>
      <summary>Captured screens · {ok}/{captures.length} from the prototype</summary>
      <div className="btn-row" style={{ margin: "10px 0 4px" }}>
        <button className="ghost" onClick={onDownloadAll} disabled={!ok} title="Download every captured screenshot as a .zip">
          ⤓ Download all (.zip)
        </button>
        <span className="meta">Screenshots are PNG.</span>
      </div>
      <div className="capture-grid">
        {captures.map((c) => (
          <figure key={c.screenKey} className={`capture ${c.ok ? "" : "capture-missing"}`}>
            {c.ok && c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer">
                <img src={c.url} alt={c.caption} loading="lazy" />
              </a>
            ) : (
              <div className="capture-placeholder">Not captured</div>
            )}
            <figcaption>
              <code className="screenkey">{c.screenKey}</code>
              <span className="cap-text">{c.caption}</span>
              {c.annotations?.length > 0 && (
                <ul className="cap-notes">{c.annotations.map((a, i) => <li key={i}>{a}</li>)}</ul>
              )}
              {!c.ok && c.note && <span className="cap-warn">{c.note}</span>}
              {c.ok && c.url && (
                <button className="ghost cap-dl" onClick={() => onDownloadOne(c)}>⤓ PNG</button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}

// ── Change brief ─────────────────────────────────────────────────────────────
// onExport (if given) renders the PDF/Word/.md row at the BOTTOM of the card,
// matching the export-at-the-bottom pattern of the other outputs.
export function BriefCard({ brief, onExport }: { brief: ChangeBrief; onExport?: (format: "pdf" | "docx" | "md") => void }) {
  const newComponents = brief.componentImpact.filter((c) => c.disposition === "net-new");
  return (
    <details className="card brief" open>
      <summary>Change brief · {brief.title}</summary>
      <dl>
        <dt>One-liner</dt>
        <dd>{brief.oneLiner}</dd>
        <dt>Change basis</dt>
        <dd>
          <span className={`pill ${brief.changeBasis.method === "inferred" ? "warn" : "ok"}`}>
            {brief.changeBasis.method === "codebase-diff" ? "Codebase diff" : brief.changeBasis.method === "url-diff" ? "Baseline-URL diff" : "Inferred — verify"}
          </span>{" "}
          {brief.changeBasis.note}
        </dd>
        <dt>What changed</dt>
        <dd><ul>{brief.whatChanged.map((x, i) => <li key={i}>{x}</li>)}</ul></dd>
        <dt>Why</dt>
        <dd>{brief.why}</dd>
        <dt>Component impact</dt>
        <dd>
          <span className={`pill ${newComponents.length ? "warn" : "ok"}`}>
            {newComponents.length ? `${newComponents.length} net-new → component spec${newComponents.length > 1 ? "s" : ""} generated` : "No net-new components"}
          </span>
          <ul style={{ marginTop: 8 }}>
            {brief.componentImpact.map((c, i) => (
              <li key={i}><strong>{c.name}</strong> <span className="meta">· {c.disposition}</span> — {c.detail}</li>
            ))}
          </ul>
        </dd>
        <dt>User-visible</dt>
        <dd>{brief.userVisible}</dd>
        <dt>Risks / edge cases</dt>
        <dd><ul>{brief.risksEdgeCases.map((x, i) => <li key={i}>{x}</li>)}</ul></dd>
        <dt>Open questions</dt>
        <dd>
          {brief.openQuestions.length ? <ul>{brief.openQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul> : <span className="empty">None flagged</span>}
        </dd>
      </dl>
      {onExport && (
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="ghost" onClick={() => onExport("pdf")}>PDF</button>
          <button className="ghost" onClick={() => onExport("docx")}>Word</button>
          <button className="ghost" onClick={() => onExport("md")}>.md</button>
        </div>
      )}
    </details>
  );
}

// ── Nav-panel run view ───────────────────────────────────────────────────────
// The shared outputs UI used by BOTH the generator and the library: a left
// navigation panel (Change brief · Captured screens · Instrumentation · then
// each artifact grouped under its package) beside a single right-hand viewer
// showing the selected output. `editable` turns on the generator's
// approve/edit/copy affordances; omit it for the read-only library view.
export function RunOutputs({
  brief,
  captures,
  instrumentation,
  artifacts,
  framework,
  exporters,
  selected,
  onSelect,
  editable = false,
  onToggleApprove,
  onEdit,
  onCopy,
}: {
  brief: ChangeBrief | null;
  captures: Capture[];
  instrumentation: InstrumentationPlan | null;
  artifacts: TabArtifact[];
  framework: string;
  exporters: Exporters;
  selected: string | null;
  onSelect: (id: string) => void;
  editable?: boolean;
  onToggleApprove?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onCopy?: (content: string) => void;
}) {
  return (
    <div className="run-outputs">
      <nav className="card nav" aria-label="Run outputs">
        <div className="nav-head">Outputs</div>
        {brief && (
          <button className={`nav-item ${selected === "brief" ? "active" : ""}`} onClick={() => onSelect("brief")}>
            <span className="nav-item-label">Change brief</span>
          </button>
        )}
        {captures.length > 0 && (
          <button className={`nav-item ${selected === "captures" ? "active" : ""}`} onClick={() => onSelect("captures")}>
            <span className="nav-item-label">Captured screens</span>
          </button>
        )}
        {instrumentation && instrumentation.points.length > 0 && (
          <button className={`nav-item ${selected === "instrumentation" ? "active" : ""}`} onClick={() => onSelect("instrumentation")}>
            <span className="nav-item-label">Instrumentation</span>
          </button>
        )}
        {PACKAGES.map((pkg) => {
          const items = artifacts.filter((a) => packageFor(a.audienceId) === pkg.id);
          if (!items.length) return null;
          return (
            <div key={pkg.id} className="nav-group">
              <div className="nav-group-title">{pkg.title}</div>
              {items.map((a) => (
                <button
                  key={a.audienceId}
                  className={`nav-item ${selected === a.audienceId ? "active" : ""}`}
                  onClick={() => onSelect(a.audienceId)}
                >
                  <span className="nav-item-label">{a.label}</span>
                  {editable && a.approved && <span className="nav-check">✓</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <section className="viewer">
        {selected === "brief" && brief ? (
          <BriefCard brief={brief} onExport={exporters.briefExport} />
        ) : selected === "captures" ? (
          <CaptureGallery captures={captures} onDownloadOne={exporters.downloadCapture} onDownloadAll={exporters.downloadCapturesZip} />
        ) : selected === "instrumentation" && instrumentation ? (
          <InstrumentationPanel plan={instrumentation} />
        ) : (
          (() => {
            const a = artifacts.find((x) => x.audienceId === selected);
            if (!a) return <div className="viewer-empty">Select an output on the left to view it.</div>;
            return (
              <ArtifactCard
                artifact={a}
                framework={framework}
                exporters={exporters}
                editable={editable}
                approved={a.approved}
                onToggleApprove={onToggleApprove ? () => onToggleApprove(a.audienceId) : undefined}
                onEdit={onEdit ? (content) => onEdit(a.audienceId, content) : undefined}
                onCopy={onCopy ? () => onCopy(a.content) : undefined}
              />
            );
          })()
        )}
      </section>
    </div>
  );
}
