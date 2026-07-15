"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ChangeBrief, PipelineEvent, Capture, SlideSpec, InstrumentationPlan } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";
import { createExporters } from "@/app/lib/exports";
import { ArtifactCard, BriefCard, CaptureGallery, InstrumentationPanel } from "@/app/components/RunViews";
import ThemeToggle from "@/app/components/ThemeToggle";

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
  { id: "design", title: "Design system", ids: ["design-system"], prefixes: ["component-"] },
  { id: "eng", title: "Engineering", ids: ["dev", "dev-code"], prefixes: [] },
  { id: "qa", title: "QA", ids: ["qa"], prefixes: [] },
  { id: "docs", title: "Documentation & support", ids: ["product-docs", "support-summary", "release-notes"], prefixes: [] },
  { id: "comms", title: "Executive comms", ids: ["one-pager", "slide"], prefixes: [] },
  { id: "story", title: "Case study", ids: ["case-study"], prefixes: [] },
  { id: "analytics", title: "Analytics & success", ids: ["analytics-plan"], prefixes: [] },
  { id: "other", title: "Other", ids: [] as string[], prefixes: [] as string[] },
];

function packageFor(audienceId: string): string {
  const p = PACKAGES.find((pkg) => pkg.ids.includes(audienceId) || pkg.prefixes.some((pre) => audienceId.startsWith(pre)));
  return p ? p.id : "other";
}

// The toggleable outputs, grouped by package, for the pre-run selection step.
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

export default function Home() {
  const [projectName, setProjectName] = useState("Groom Lake Toolbar");
  const [url, setUrl] = useState("https://forge-demo-toolbar-after.vercel.app/");
  const [designDescription, setDesignDescription] = useState(
    "The Search page toolbar, restyled to the Groom Lake / Praxis design language: rounder, gradient-filled controls, refined icons, and a first-class dark mode. The control set and spacing are unchanged.",
  );
  const [projectContext, setProjectContext] = useState(
    "Part of the wider EHSQ-E reskin toward the Praxis design language. This toolbar appears on Search pages across multiple modules (Incidents, Audits, CAPA, MOC).",
  );
  const [focusAreas, setFocusAreas] = useState(
    "Fidelity of the visual restyle to Praxis; the new dark-mode variant; accessibility (aria labels, visible focus); and the responsive collapse into Tools/Options menus.",
  );
  const [designDecisions, setDesignDecisions] = useState(
    "Kept the control set and spacing unchanged to avoid retraining users. Added a first-class dark variant. The selected display mode now uses a gradient + shadow to read as active.",
  );
  const [baselineUrl, setBaselineUrl] = useState("https://forge-demo-toolbar-before.vercel.app/");
  const [codebasePath, setCodebasePath] = useState("");
  const [framework, setFramework] = useState("vue");
  const [subject, setSubject] = useState("Search page toolbar");
  const [componentSelector, setComponentSelector] = useState(".toolbar");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [brief, setBrief] = useState<ChangeBrief | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [instrumentation, setInstrumentation] = useState<InstrumentationPlan | null>(null);
  const [artifacts, setArtifacts] = useState<UiArtifact[]>([]);
  const [savedRun, setSavedRun] = useState<{ id: string; project: string } | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(ALL_OUTPUT_IDS.map((id) => [id, true])));
  const [selected, setSelected] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const enabledCount = ALL_OUTPUT_IDS.filter((id) => enabled[id]).length;

  // Which top-level tab is active, derived from the current selection: one of the
  // fixed views ("brief" | "captures" | "instrumentation") or a package id.
  const activeSection =
    selected === "brief" || selected === "captures" || selected === "instrumentation"
      ? selected
      : (() => {
          const a = artifacts.find((x) => x.audienceId === selected);
          return a ? packageFor(a.audienceId) : null;
        })();

  const exporters = createExporters({ captures, brief, framework, onError: setError, onNotice: setNotice });

  async function run() {
    setRunning(true);
    setError(""); setNotice("");
    setBrief(null); setCaptures([]); setInstrumentation(null); setArtifacts([]); setSavedRun(null);
    setSelected(null);
    setStatus("Starting…");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prototypeUrl: url, baselineUrl, codebasePath, framework,
          enabledOutputs: ALL_OUTPUT_IDS.filter((id) => enabled[id]),
          subject, componentSelector,
          projectName, designDescription, projectContext, focusAreas, designDecisions,
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
      case "status": setStatus(ev.message); break;
      case "brief": setBrief(ev.brief); setSelected((s) => s ?? "brief"); break;
      case "captures": setCaptures(ev.captures); break;
      case "instrumentation": setInstrumentation(ev.plan); break;
      case "artifact": setArtifacts((prev) => [...prev, { ...ev.artifact, approved: false }]); setSelected((s) => s ?? ev.artifact.audienceId); break;
      case "error": setError(ev.message); break;
      case "done":
        setStatus("");
        if (ev.savedRunId && ev.project) setSavedRun({ id: ev.savedRunId, project: ev.project });
        break;
    }
  }

  function updateArtifact(id: string, content: string) {
    setArtifacts((prev) => prev.map((a) => (a.audienceId === id ? { ...a, content } : a)));
  }
  function toggleApprove(id: string) {
    setArtifacts((prev) => prev.map((a) => (a.audienceId === id ? { ...a, approved: !a.approved } : a)));
  }
  function copy(content: string) {
    navigator.clipboard?.writeText(content);
  }
  async function downloadAll() {
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: brief?.title,
          meta: { prototypeUrl: url, baselineUrl, note: designDescription, framework, generatedAt: new Date().toISOString() },
          brief, artifacts, captures,
        }),
      });
      if (!res.ok) { setError(`Download failed: ${await res.text().catch(() => res.statusText)}`); return; }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href; link.download = "handoff.zip"; link.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="topbar">
          <div className="kicker">Design Handoff Harness <span className="ver">v{APP_VERSION}</span></div>
          <nav className="topnav">
            <span className="topnav-active">Generator</span>
            <Link href="/library">Library →</Link>
            <ThemeToggle />
          </nav>
        </div>
        <h1>One change, every audience</h1>
        <p>
          Point it at a completed prototype and describe the design. It builds one canonical change brief,
          then fans that out into a tailored draft for each downstream audience — reviewed by you, and
          archived to the library for later reference.
        </p>
      </header>

      <details className="card setup" open>
        <summary className="setup-summary">
          <span className="setup-title">Handoff setup</span>
          <span className="setup-meta">{enabledCount} of {ALL_OUTPUT_IDS.length} outputs selected</span>
        </summary>
        <div className="setup-body">
        <label className="field">
          <span className="lab">Design project — groups this run in the library</span>
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Groom Lake Toolbar" disabled={running} />
        </label>
        <label className="field">
          <span className="lab">Prototype URL</span>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-prototype.vercel.app/" disabled={running} />
        </label>

        <div className="describe">
          <div className="describe-head">Describe the design — the richer this is, the less the agent has to guess</div>
          <label className="field">
            <span className="lab">What the new design is</span>
            <textarea value={designDescription} onChange={(e) => setDesignDescription(e.target.value)} rows={3} disabled={running} placeholder="What changed and what it now does — the essence of the new design." />
          </label>
          <label className="field">
            <span className="lab">Surrounding context</span>
            <textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} rows={2} disabled={running} placeholder="The bigger initiative, where this lives, who it's for." />
          </label>
          <label className="field">
            <span className="lab">Focus areas — what matters most</span>
            <textarea value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} rows={2} disabled={running} placeholder="What the handoffs should emphasise (accessibility, responsiveness, a specific interaction…)." />
          </label>
          <label className="field">
            <span className="lab">Key design decisions &amp; rationale</span>
            <textarea value={designDecisions} onChange={(e) => setDesignDecisions(e.target.value)} rows={3} disabled={running} placeholder="The choices you made and WHY — trade-offs, what you deliberately kept the same, alternatives you set aside." />
          </label>
        </div>

        <label className="field">
          <span className="lab">Component / subject — keeps analysis on the component, not the demo page</span>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Search page toolbar" disabled={running} />
        </label>
        <label className="field">
          <span className="lab">Component selector — scopes screenshots to the component (optional CSS)</span>
          <input type="text" value={componentSelector} onChange={(e) => setComponentSelector(e.target.value)} placeholder=".toolbar" disabled={running} />
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
                    <input type="checkbox" checked={!!enabled[i.id]} disabled={running} onChange={() => setEnabled((e) => ({ ...e, [i.id]: !e[i.id] }))} />
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
            Give it the <strong>before</strong> state for a real diff. Point it at a
            <strong> &ldquo;before&rdquo; prototype URL</strong> (it screenshots and reads the rendered HTML/CSS of
            both and compares), or a local codebase path. With neither, it infers from your description.
          </p>
          <label className="field">
            <span className="lab">&ldquo;Before&rdquo; prototype URL — compares the new design against it (visual + code)</span>
            <input type="url" value={baselineUrl} onChange={(e) => setBaselineUrl(e.target.value)} placeholder="https://search-toolbar-before.vercel.app/" disabled={running} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lab">Current source codebase path (alternative — local runs only)</span>
            <input type="text" value={codebasePath} onChange={(e) => setCodebasePath(e.target.value)} placeholder="/path/to/current/app/source" disabled={running} />
          </label>
        </details>

        <div className="btn-row">
          <button className="primary" onClick={run} disabled={running || !url || enabledCount === 0}>
            {running ? "Running…" : "Generate handoff"}
          </button>
          {running && <button className="ghost" onClick={() => abortRef.current?.abort()}>Cancel</button>}
        </div>
        {status && <div className="status"><span className="spinner" /> {status}</div>}
        {error && <p className="err">Error: {error}</p>}
        {notice && <p className="notice" onClick={() => setNotice("")} title="Dismiss">{notice}</p>}
        {savedRun && (
          <p className="notice">
            ✓ Saved to library ·{" "}
            <Link href={`/library?project=${savedRun.project}&run=${savedRun.id}`}>view this run →</Link>
          </p>
        )}
        </div>
      </details>

      {(brief || artifacts.length > 0) && (
        <div className="results">
          <div className="results-head">
            <div className="nav-head" style={{ margin: 0 }}>
              Outputs · {artifacts.filter((a) => a.approved).length}/{artifacts.length} approved
            </div>
            <button className="nav-download" style={{ width: "auto", margin: 0 }} onClick={downloadAll} disabled={running} title="Download the brief, all artifacts, screenshots and the deck as a .zip">
              ⤓ Download all (.zip)
            </button>
          </div>

          <div className="tabbar" role="tablist">
            {brief && (
              <button role="tab" aria-selected={selected === "brief"} className={`tab ${selected === "brief" ? "active" : ""}`} onClick={() => setSelected("brief")}>
                Change brief
              </button>
            )}
            {captures.length > 0 && (
              <button role="tab" aria-selected={selected === "captures"} className={`tab ${selected === "captures" ? "active" : ""}`} onClick={() => setSelected("captures")}>
                Captured screens
              </button>
            )}
            {instrumentation && instrumentation.points.length > 0 && (
              <button role="tab" aria-selected={selected === "instrumentation"} className={`tab ${selected === "instrumentation" ? "active" : ""}`} onClick={() => setSelected("instrumentation")}>
                Instrumentation
              </button>
            )}
            {PACKAGES.map((pkg) => {
              const items = artifacts.filter((a) => packageFor(a.audienceId) === pkg.id);
              if (!items.length) return null;
              const allApproved = items.every((a) => a.approved);
              return (
                <button
                  key={pkg.id}
                  role="tab"
                  aria-selected={activeSection === pkg.id}
                  className={`tab ${activeSection === pkg.id ? "active" : ""}`}
                  onClick={() => setSelected(items[0].audienceId)}
                  title={items.length > 1 ? `${items.length} outputs` : undefined}
                >
                  {pkg.title}
                  {items.length > 1 && <span className="tab-count">{items.length}</span>}
                  {allApproved && <span className="tab-check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="tabpanel">
            {selected === "brief" && brief ? (
              <div>
                <div className="btn-row" style={{ marginBottom: 12 }}>
                  <button className="ghost" onClick={() => exporters.briefExport("pdf")}>PDF</button>
                  <button className="ghost" onClick={() => exporters.briefExport("docx")}>Word</button>
                  <button className="ghost" onClick={() => exporters.briefExport("md")}>.md</button>
                </div>
                <BriefCard brief={brief} />
              </div>
            ) : selected === "captures" ? (
              <CaptureGallery captures={captures} onDownloadOne={exporters.downloadCapture} onDownloadAll={exporters.downloadCapturesZip} />
            ) : selected === "instrumentation" && instrumentation ? (
              <InstrumentationPanel plan={instrumentation} />
            ) : (
              (() => {
                const a = artifacts.find((x) => x.audienceId === selected);
                if (!a) return <div className="viewer-empty">Select a tab to view its output.</div>;
                const pkgId = packageFor(a.audienceId);
                const siblings = artifacts.filter((x) => packageFor(x.audienceId) === pkgId);
                return (
                  <div>
                    {siblings.length > 1 && (
                      <div className="subtabs">
                        {siblings.map((s) => (
                          <button
                            key={s.audienceId}
                            className={`subtab ${selected === s.audienceId ? "active" : ""}`}
                            onClick={() => setSelected(s.audienceId)}
                          >
                            {s.label}
                            {s.approved && <span className="tab-check">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    <ArtifactCard
                      artifact={a}
                      framework={framework}
                      exporters={exporters}
                      editable
                      approved={a.approved}
                      onToggleApprove={() => toggleApprove(a.audienceId)}
                      onEdit={(content) => updateArtifact(a.audienceId, content)}
                      onCopy={() => copy(a.content)}
                    />
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
