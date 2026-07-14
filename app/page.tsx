"use client";

import { useRef, useState } from "react";
import type { ChangeBrief, PipelineEvent, Capture, SlideSpec } from "@/lib/types";

type UiArtifact = {
  audienceId: string;
  label: string;
  content: string;
  approved: boolean;
  slideSpec?: SlideSpec;
};

// The seven review packages. Each artifact is routed to one by id/prefix so the
// ~15 drafts read as a small set of grouped deliverables rather than a long list.
const PACKAGES = [
  { id: "design", title: "Design system", blurb: "Updates and net-new component specs for the DS team.", ids: ["design-system"], prefixes: ["component-"] },
  { id: "eng", title: "Engineering", blurb: "Implementation spec plus a starting-point coded component.", ids: ["dev", "dev-code"], prefixes: [] },
  { id: "qa", title: "QA", blurb: "Test cases and instructions for the build.", ids: ["qa"], prefixes: [] },
  { id: "docs", title: "Documentation & support", blurb: "Product-doc updates, a support summary, and release notes.", ids: ["product-docs", "support-summary", "release-notes"], prefixes: [] },
  { id: "comms", title: "Executive comms", blurb: "A 1-pager and a presentation slide (with .pptx).", ids: ["one-pager", "slide"], prefixes: [] },
  { id: "story", title: "Case study", blurb: "The narrative: why, decisions, before/after, outcomes.", ids: ["case-study"], prefixes: [] },
  { id: "analytics", title: "Analytics & success", blurb: "What success looks like and testable Gainsight hypotheses.", ids: ["analytics-plan"], prefixes: [] },
  { id: "other", title: "Other", blurb: "", ids: [] as string[], prefixes: [] as string[] },
];

function packageFor(audienceId: string): string {
  const p = PACKAGES.find(
    (pkg) => pkg.ids.includes(audienceId) || pkg.prefixes.some((pre) => audienceId.startsWith(pre)),
  );
  return p ? p.id : "other";
}

// The toggleable outputs, grouped by package, for the pre-run selection step.
// (Component specs are conditional and ride along with "design-system".)
const OUTPUTS: { pkg: string; items: { id: string; label: string }[] }[] = [
  { pkg: "Design system", items: [{ id: "design-system", label: "DS updates + component specs" }] },
  { pkg: "Engineering", items: [{ id: "dev", label: "Developer handoff (spec)" }, { id: "dev-code", label: "Coded component" }] },
  { pkg: "QA", items: [{ id: "qa", label: "QA test cases" }] },
  { pkg: "Documentation & support", items: [{ id: "product-docs", label: "Product docs" }, { id: "support-summary", label: "Support summary" }, { id: "release-notes", label: "Release notes" }] },
  { pkg: "Executive comms", items: [{ id: "one-pager", label: "1-Pager" }, { id: "slide", label: "Slide (.pptx)" }] },
  { pkg: "Case study", items: [{ id: "case-study", label: "Case study" }] },
  { pkg: "Analytics & success", items: [{ id: "analytics-plan", label: "Analytics plan" }] },
];
const ALL_OUTPUT_IDS = OUTPUTS.flatMap((g) => g.items.map((i) => i.id));

// Per-output export/download options. Every artifact also gets Approve + Copy
// (rendered separately). Rendered in EXPORT_ORDER, filtered to each output's set.
const EXPORTS: Record<string, string[]> = {
  "design-system": ["md", "pdf", "docx", "email", "jira"],
  dev: ["md", "pdf", "docx", "jira"],
  "dev-code": ["js", "jira"],
  qa: ["md", "pdf", "docx", "email", "jira"],
  "product-docs": ["md", "pdf", "docx", "email"],
  "support-summary": ["md", "pdf", "docx", "email"],
  "release-notes": ["md", "pdf", "docx", "email"],
  slide: ["pptx", "pdf", "email"],
  "one-pager": ["md", "pdf", "docx", "email"],
  "case-study": ["md", "pdf", "docx", "email"],
  "analytics-plan": ["md", "pdf", "docx", "email"],
};
const EXPORT_ORDER = ["pptx", "js", "pdf", "docx", "md", "email", "jira"];
const EXPORT_LABEL: Record<string, string> = {
  pptx: ".pptx", md: ".md", pdf: "PDF", docx: "Word", email: "Email", jira: "Jira",
};

// Net-new component specs (component-*) are a design-system deliverable.
function exportsFor(id: string): string[] {
  if (EXPORTS[id]) return EXPORTS[id];
  if (id.startsWith("component-")) return ["md", "pdf", "docx", "email", "jira"];
  return ["md", "pdf", "docx"];
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artifact";
}
// Pull the code out of the dev-code Markdown (fenced blocks), falling back to the
// whole content. Extension follows the chosen framework.
function extractCode(md: string): string {
  const blocks = [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\s+$/, ""));
  return blocks.length ? blocks.join("\n\n") : md;
}
function codeExt(framework: string): string {
  return ({ vue: "vue", react: "jsx", svelte: "svelte", angular: "ts" } as Record<string, string>)[
    (framework || "").toLowerCase()
  ] ?? "js";
}

export default function Home() {
  const [url, setUrl] = useState("https://forge-demo-toolbar-after.vercel.app/");
  const [note, setNote] = useState(
    "Restyled the search toolbar to the Groom Lake / Praxis design language.",
  );
  const [baselineUrl, setBaselineUrl] = useState("https://forge-demo-toolbar-before.vercel.app/");
  const [codebasePath, setCodebasePath] = useState("");
  const [framework, setFramework] = useState("vue");
  const [subject, setSubject] = useState("Search page toolbar");
  const [componentSelector, setComponentSelector] = useState(".toolbar");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [brief, setBrief] = useState<ChangeBrief | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [artifacts, setArtifacts] = useState<UiArtifact[]>([]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_OUTPUT_IDS.map((id) => [id, true])),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const enabledCount = ALL_OUTPUT_IDS.filter((id) => enabled[id]).length;

  async function run() {
    setRunning(true);
    setError("");
    setBrief(null);
    setCaptures([]);
    setArtifacts([]);
    setSelected(null);
    setStatus("Starting…");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prototypeUrl: url,
          note,
          baselineUrl,
          codebasePath,
          framework,
          enabledOutputs: ALL_OUTPUT_IDS.filter((id) => enabled[id]),
          subject,
          componentSelector,
        }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line) as PipelineEvent);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(String(e));
    } finally {
      setRunning(false);
      setStatus("");
      abortRef.current = null;
    }
  }

  function handleEvent(ev: PipelineEvent) {
    switch (ev.type) {
      case "status":
        setStatus(ev.message);
        break;
      case "brief":
        setBrief(ev.brief);
        setSelected((s) => s ?? "brief"); // show the brief first as it lands
        break;
      case "captures":
        setCaptures(ev.captures);
        break;
      case "artifact":
        setArtifacts((prev) => [...prev, { ...ev.artifact, approved: false }]);
        setSelected((s) => s ?? ev.artifact.audienceId);
        break;
      case "error":
        setError(ev.message);
        break;
      case "done":
        setStatus("");
        break;
    }
  }

  function updateArtifact(id: string, content: string) {
    setArtifacts((prev) => prev.map((a) => (a.audienceId === id ? { ...a, content } : a)));
  }
  function toggleApprove(id: string) {
    setArtifacts((prev) =>
      prev.map((a) => (a.audienceId === id ? { ...a, approved: !a.approved } : a)),
    );
  }
  function copy(content: string) {
    navigator.clipboard?.writeText(content);
  }
  async function saveBlob(res: Response, fallbackName: string) {
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      setError(`Download failed: ${msg}`);
      return;
    }
    const blob = await res.blob();
    // Prefer the server-provided filename.
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = m?.[1] || fallbackName;
    link.click();
    URL.revokeObjectURL(href);
  }

  // Save a client-built blob (used for .md and code files — no round-trip needed).
  function saveLocalBlob(content: BlobPart, name: string, type = "text/plain;charset=utf-8") {
    const href = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
  }

  function post(url: string, body: unknown) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  async function downloadDeck(a: UiArtifact) {
    if (!a.slideSpec) return;
    try {
      await saveBlob(await post("/api/deck", { slideSpec: a.slideSpec, captures }), "slide.pptx");
    } catch (e) {
      setError(String(e));
    }
  }
  async function downloadSlidePdf(a: UiArtifact) {
    if (!a.slideSpec) return;
    try {
      await saveBlob(await post("/api/slide-pdf", { slideSpec: a.slideSpec, captures }), "slide.pdf");
    } catch (e) {
      setError(String(e));
    }
  }
  async function downloadExport(a: UiArtifact, format: "pdf" | "docx") {
    try {
      await saveBlob(await post("/api/export", { format, title: a.label, content: a.content }), `${slugify(a.audienceId)}.${format}`);
    } catch (e) {
      setError(String(e));
    }
  }
  function downloadMd(a: UiArtifact) {
    saveLocalBlob(a.content, `${slugify(a.audienceId)}.md`, "text/markdown;charset=utf-8");
  }
  function downloadCode(a: UiArtifact) {
    saveLocalBlob(extractCode(a.content), `component.${codeExt(framework)}`);
  }
  function jiraStub(a: UiArtifact) {
    setError("");
    setNotice(`Jira export for “${a.label}” is stubbed — the integration isn’t wired up yet.`);
  }
  async function emailDraft(a: UiArtifact) {
    try {
      const res = await post("/api/email", {
        artifact: { audienceId: a.audienceId, label: a.label, content: a.content },
        changeTitle: brief?.title,
        // For the slide, the server attaches the generated .pptx to the draft.
        slideSpec: a.slideSpec,
        captures: a.audienceId === "slide" ? captures : undefined,
      });
      await saveBlob(res, `${a.audienceId}-draft.eml`);
    } catch (e) {
      setError(String(e));
    }
  }
  async function briefExport(format: "md" | "pdf" | "docx") {
    if (!brief) return;
    try {
      await saveBlob(await post("/api/brief-export", { format, brief }), `change-brief.${format}`);
    } catch (e) {
      setError(String(e));
    }
  }
  async function downloadCapture(c: Capture) {
    if (!c.ok || !c.url) return;
    try {
      const res = await fetch(c.url);
      saveLocalBlob(await res.blob(), `${slugify(c.screenKey)}.png`, "image/png");
    } catch (e) {
      setError(String(e));
    }
  }
  async function downloadCapturesZip() {
    try {
      await saveBlob(await post("/api/captures-zip", { captures }), "screenshots.zip");
    } catch (e) {
      setError(String(e));
    }
  }
  async function downloadAll() {
    try {
      const res = await post("/api/bundle", {
        title: brief?.title,
        meta: { prototypeUrl: url, baselineUrl, note, framework, generatedAt: new Date().toISOString() },
        brief,
        artifacts,
        captures,
      });
      await saveBlob(res, "handoff.zip");
    } catch (e) {
      setError(String(e));
    }
  }

  function renderArtifact(a: UiArtifact) {
    const caps = exportsFor(a.audienceId);
    return (
      <div key={a.audienceId} className={`card artifact ${a.approved ? "approved" : ""}`}>
        <div className="artifact-head">
          <h3>{a.label}</h3>
          {a.approved && <span className="approved-tag">✓ Approved</span>}
        </div>
        <textarea value={a.content} onChange={(e) => updateArtifact(a.audienceId, e.target.value)} />
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className={a.approved ? "" : "primary"} onClick={() => toggleApprove(a.audienceId)}>
            {a.approved ? "Unapprove" : "Approve"}
          </button>
          <button className="ghost" onClick={() => copy(a.content)}>
            Copy
          </button>
          {EXPORT_ORDER.filter((cap) => caps.includes(cap)).map((cap) => {
            const label = cap === "js" ? `.${codeExt(framework)}` : EXPORT_LABEL[cap];
            const onClick = () => {
              if (cap === "pptx") return downloadDeck(a);
              if (cap === "js") return downloadCode(a);
              if (cap === "md") return downloadMd(a);
              if (cap === "pdf") return a.audienceId === "slide" ? downloadSlidePdf(a) : downloadExport(a, "pdf");
              if (cap === "docx") return downloadExport(a, "docx");
              if (cap === "email") return emailDraft(a);
              if (cap === "jira") return jiraStub(a);
            };
            return (
              <button key={cap} className="ghost" onClick={onClick}>
                {label}
              </button>
            );
          })}
          {caps.includes("email") && (
            <span className="meta">
              Email is stubbed — downloads a draft .eml to send from Outlook
              {a.audienceId === "slide" ? " (with the .pptx attached)" : ""}.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="kicker">Design Handoff Harness</div>
        <h1>One change, every audience</h1>
        <p>
          Point it at a completed prototype. It builds one canonical change brief, then fans
          that out into a tailored draft for each downstream audience — for you to review, edit,
          and approve before anything is sent.
        </p>
      </header>

      <div className="card">
        <label className="field">
          <span className="lab">Prototype URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-prototype.vercel.app/"
            disabled={running}
          />
        </label>
        <label className="field">
          <span className="lab">What changed &amp; why (one or two lines)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            disabled={running}
          />
        </label>
        <label className="field">
          <span className="lab">Component / subject — what the change is about (keeps the analysis on the component, not the demo page)</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Search page toolbar"
            disabled={running}
          />
        </label>
        <label className="field">
          <span className="lab">Component selector — scopes screenshots to the component (optional CSS)</span>
          <input
            type="text"
            value={componentSelector}
            onChange={(e) => setComponentSelector(e.target.value)}
            placeholder=".toolbar"
            disabled={running}
          />
        </label>
        <label className="field">
          <span className="lab">Developer code target</span>
          <select value={framework} onChange={(e) => setFramework(e.target.value)} disabled={running}>
            <option value="vue">Vue 3 (design-system-mapped)</option>
            <option value="react">React (best-effort — no DS mapping yet)</option>
            <option value="svelte">Svelte (best-effort — no DS mapping yet)</option>
          </select>
        </label>
        <details className="baseline" open>
          <summary>Outputs — {enabledCount} of {ALL_OUTPUT_IDS.length} selected</summary>
          <div className="out-select">
            {OUTPUTS.map((g) => (
              <div key={g.pkg} className="out-group">
                <div className="out-group-title">{g.pkg}</div>
                {g.items.map((i) => (
                  <label key={i.id} className="out-check">
                    <input
                      type="checkbox"
                      checked={!!enabled[i.id]}
                      disabled={running}
                      onChange={() => setEnabled((e) => ({ ...e, [i.id]: !e[i.id] }))}
                    />
                    <span>{i.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </details>
        <details className="baseline">
          <summary>Baseline — compare against a &ldquo;before&rdquo; (optional, recommended)</summary>
          <p className="meta" style={{ margin: "8px 0 12px" }}>
            Give it the <strong>before</strong> state for a real diff. Best for a visual/styling
            change: point it at a <strong>&ldquo;before&rdquo; prototype URL</strong> — the agent
            screenshots and reads the rendered HTML/CSS of both and compares them. Or give a local
            codebase path. With neither, it infers from your note and flags it unverified.
          </p>
          <label className="field">
            <span className="lab">&ldquo;Before&rdquo; prototype URL — compares the new design against it (visual + code)</span>
            <input
              type="url"
              value={baselineUrl}
              onChange={(e) => setBaselineUrl(e.target.value)}
              placeholder="https://search-toolbar-before.vercel.app/"
              disabled={running}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lab">Current source codebase path (alternative — local runs only)</span>
            <input
              type="text"
              value={codebasePath}
              onChange={(e) => setCodebasePath(e.target.value)}
              placeholder="/path/to/current/app/source"
              disabled={running}
            />
          </label>
        </details>
        <div className="btn-row">
          <button className="primary" onClick={run} disabled={running || !url || enabledCount === 0}>
            {running ? "Running…" : "Generate handoff"}
          </button>
          {running && (
            <button className="ghost" onClick={() => abortRef.current?.abort()}>
              Cancel
            </button>
          )}
        </div>
        {status && (
          <div className="status">
            <span className="spinner" /> {status}
          </div>
        )}
        {error && <p className="err">Error: {error}</p>}
        {notice && (
          <p className="notice" onClick={() => setNotice("")} title="Dismiss">
            {notice}
          </p>
        )}
      </div>

      {(brief || artifacts.length > 0) && (
        <div className="workspace">
          <nav className="card nav">
            <div className="nav-head">
              Outputs · {artifacts.filter((a) => a.approved).length}/{artifacts.length} approved
            </div>
            <button className="nav-download" onClick={downloadAll} disabled={running} title="Download the brief, all artifacts, screenshots and the deck as a .zip">
              ⤓ Download all (.zip)
            </button>
            {brief && (
              <button className={`nav-item ${selected === "brief" ? "active" : ""}`} onClick={() => setSelected("brief")}>
                <span className="nav-item-label">Change brief</span>
              </button>
            )}
            {captures.length > 0 && (
              <button
                className={`nav-item ${selected === "captures" ? "active" : ""}`}
                onClick={() => setSelected("captures")}
              >
                <span className="nav-item-label">Captured screens</span>
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
                      onClick={() => setSelected(a.audienceId)}
                    >
                      <span className="nav-item-label">{a.label}</span>
                      {a.approved && <span className="nav-check">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          <section className="viewer">
            {selected === "brief" && brief ? (
              <div>
                <div className="btn-row" style={{ marginBottom: 12 }}>
                  <button className="ghost" onClick={() => briefExport("pdf")}>PDF</button>
                  <button className="ghost" onClick={() => briefExport("docx")}>Word</button>
                  <button className="ghost" onClick={() => briefExport("md")}>.md</button>
                </div>
                <BriefCard brief={brief} />
              </div>
            ) : selected === "captures" ? (
              <CaptureGallery captures={captures} onDownloadOne={downloadCapture} onDownloadAll={downloadCapturesZip} />
            ) : (
              (() => {
                const a = artifacts.find((x) => x.audienceId === selected);
                return a ? (
                  renderArtifact(a)
                ) : (
                  <div className="viewer-empty">Select an output on the left to view it.</div>
                );
              })()
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CaptureGallery({
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
      <summary>
        Captured screens · {ok}/{captures.length} from the prototype
      </summary>
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
                <ul className="cap-notes">
                  {c.annotations.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
              {!c.ok && c.note && <span className="cap-warn">{c.note}</span>}
              {c.ok && c.url && (
                <button className="ghost cap-dl" onClick={() => onDownloadOne(c)}>
                  ⤓ PNG
                </button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}

function BriefCard({ brief }: { brief: ChangeBrief }) {
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
            {brief.changeBasis.method === "codebase-diff"
              ? "Codebase diff"
              : brief.changeBasis.method === "url-diff"
                ? "Baseline-URL diff"
                : "Inferred — verify"}
          </span>{" "}
          {brief.changeBasis.note}
        </dd>

        <dt>What changed</dt>
        <dd>
          <ul>{brief.whatChanged.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </dd>

        <dt>Why</dt>
        <dd>{brief.why}</dd>

        <dt>Component impact</dt>
        <dd>
          <span className={`pill ${newComponents.length ? "warn" : "ok"}`}>
            {newComponents.length
              ? `${newComponents.length} net-new → component spec${newComponents.length > 1 ? "s" : ""} generated`
              : "No net-new components"}
          </span>
          <ul style={{ marginTop: 8 }}>
            {brief.componentImpact.map((c, i) => (
              <li key={i}>
                <strong>{c.name}</strong>{" "}
                <span className="meta">· {c.disposition}</span> — {c.detail}
              </li>
            ))}
          </ul>
        </dd>

        <dt>User-visible</dt>
        <dd>{brief.userVisible}</dd>

        <dt>Risks / edge cases</dt>
        <dd>
          <ul>{brief.risksEdgeCases.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </dd>

        <dt>Open questions</dt>
        <dd>
          {brief.openQuestions.length ? (
            <ul>{brief.openQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
          ) : (
            <span className="empty">None flagged</span>
          )}
        </dd>
      </dl>
    </details>
  );
}
