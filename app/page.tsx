"use client";

import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { formatDuration } from "@/lib/format";
import { RunOutputs } from "@/app/components/RunViews";
import CubesLoader from "@/app/components/CubesLoader";
import ThemeToggle from "@/app/components/ThemeToggle";
import { DESIGN_SOURCES } from "@/lib/designSources";
import { DEMO_CASES } from "@/lib/demoCases";
import { useRun, OUTPUTS, ALL_OUTPUT_IDS, FEED_ICON } from "@/app/RunProvider";

// Required-field indicator: a red asterisk symbol until a value is present, then
// a teal check-in-a-circle. Value-driven, so demo-case auto-fill flips it too.
function ReqMark({ filled }: { filled: boolean }) {
  return filled ? (
    <span className="req req-done" role="img" aria-label="provided" title="Provided">✓</span>
  ) : (
    <span className="req req-todo" role="img" aria-label="required" title="Required">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="6" y1="1.5" x2="6" y2="10.5" />
          <line x1="2.1" y1="3.75" x2="9.9" y2="8.25" />
          <line x1="2.1" y1="8.25" x2="9.9" y2="3.75" />
        </g>
      </svg>
    </span>
  );
}

export default function Home() {
  const {
    projectName, setProjectName, url, setUrl, designDescription, setDesignDescription,
    projectContext, setProjectContext, focusAreas, setFocusAreas, designDecisions, setDesignDecisions,
    baselineUrl, setBaselineUrl, codebasePath, setCodebasePath, codebaseScope, setCodebaseScope,
    demoCase, applyDemoCase, framework, setFramework, designSource, setDesignSource,
    subject, setSubject, componentSelector, setComponentSelector,
    crawl, setCrawl, screensText, setScreensText, maxScreens, setMaxScreens,
    running, status, error, notice, setNotice, brief, captures, instrumentation, artifacts,
    savedRun, elapsedMs, feed, feedOpen, setFeedOpen, setupOpen, setSetupOpen,
    enabled, setEnabled, selected, setSelected, notifyWhenDone, setNotifyWhenDone,
    enabledCount, showLoader, exporters,
    abortRef, feedBodyRef, loaderRef,
    run, updateArtifact, toggleApprove, copy, downloadAll,
  } = useRun();

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

      <div className="card setup">
        <details className="setup-fold" open={setupOpen} onToggle={(e) => setSetupOpen(e.currentTarget.open)}>
          <summary className="setup-summary">
            <span className="setup-title">Handoff setup</span>
            <span className="setup-meta">{enabledCount} of {ALL_OUTPUT_IDS.length} outputs selected</span>
            <span className="setup-toggle">{setupOpen ? "Hide Setup" : "Show Setup"}</span>
          </summary>
          <div className="setup-body">
        <label className="field demo-case">
          <span className="lab">Demo case — optional; populates the fields below so you can watch a run</span>
          <select value={demoCase} onChange={(e) => applyDemoCase(e.target.value)} disabled={running}>
            <option value="custom">None</option>
            {DEMO_CASES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="lab lab-req">Design project — groups this run in the library<ReqMark filled={!!projectName.trim()} /></span>
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Nexus Toolbar" disabled={running} />
        </label>
        <label className="field">
          <span className="lab lab-req">Prototype URL<ReqMark filled={!!url.trim()} /></span>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-prototype.vercel.app/" disabled={running} />
        </label>

        <div className="describe">
          <div className="describe-head">Describe the design — the richer this is, the less the agent has to guess</div>
          <label className="field">
            <span className="lab lab-req">What the new design is<ReqMark filled={!!designDescription.trim()} /></span>
            <textarea value={designDescription} onChange={(e) => setDesignDescription(e.target.value)} rows={3} disabled={running} placeholder="What changed and what it now does — the essence of the new design." />
          </label>
          <label className="field">
            <span className="lab lab-req">Surrounding context<ReqMark filled={!!projectContext.trim()} /></span>
            <textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} rows={2} disabled={running} placeholder="The bigger initiative, where this lives, who it's for." />
          </label>
          <label className="field">
            <span className="lab lab-req">Focus areas — what matters most<ReqMark filled={!!focusAreas.trim()} /></span>
            <textarea value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} rows={2} disabled={running} placeholder="What the handoffs should emphasise (accessibility, responsiveness, a specific interaction…)." />
          </label>
          <label className="field">
            <span className="lab lab-req">Key design decisions &amp; rationale<ReqMark filled={!!designDecisions.trim()} /></span>
            <textarea value={designDecisions} onChange={(e) => setDesignDecisions(e.target.value)} rows={3} disabled={running} placeholder="The choices you made and WHY — trade-offs, what you deliberately kept the same, alternatives you set aside." />
          </label>
        </div>

        <label className="field">
          <span className="lab lab-req">Component / subject — keeps analysis on the component, not the demo page<ReqMark filled={!!subject.trim()} /></span>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Search page toolbar" disabled={running} />
        </label>
        <label className="field">
          <span className="lab">Component selector — scopes screenshots to the component (optional CSS)</span>
          <input type="text" value={componentSelector} onChange={(e) => setComponentSelector(e.target.value)} placeholder=".toolbar" disabled={running} />
        </label>
        <label className="field">
          <span className="lab">Design source — the system the generated code should match</span>
          <select value={designSource} onChange={(e) => setDesignSource(e.target.value)} disabled={running}>
            {DESIGN_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <span className="meta">{DESIGN_SOURCES.find((s) => s.id === designSource)?.blurb}</span>
        </label>
        <label className="field">
          <span className="lab">Developer code target — framework (used when the design source doesn&rsquo;t fix its own)</span>
          <select value={framework} onChange={(e) => setFramework(e.target.value)} disabled={running || designSource === "miramar"}>
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
          <label className="field">
            <span className="lab">Current source codebase path (alternative — local runs only)</span>
            <input type="text" value={codebasePath} onChange={(e) => setCodebasePath(e.target.value)} placeholder="/path/to/miramar" disabled={running} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lab">Codebase scope — a subpath to diff against, so it doesn&rsquo;t scan the whole app (recommended for large repos)</span>
            <input type="text" value={codebaseScope} onChange={(e) => setCodebaseScope(e.target.value)} placeholder="e.g. src/components/Search" disabled={running} />
          </label>
        </details>
        <details className="baseline">
          <summary>Large prototype — multiple pages / full app (optional)</summary>
          <p className="meta" style={{ margin: "8px 0 12px" }}>
            For a multi-screen prototype, the harness maps its screens, then — with a
            &ldquo;before&rdquo; URL above — processes <strong>only the screens that changed</strong>,
            analysing them in parallel and merging into one brief. Leave all of this blank for a
            single-screen run.
          </p>
          <label className="out-check" style={{ marginBottom: 10 }}>
            <input type="checkbox" checked={crawl} disabled={running} onChange={(e) => setCrawl(e.target.checked)} />
            <span>Crawl linked screens — follow same-origin links from the prototype URL</span>
          </label>
          <label className="field">
            <span className="lab">Explicit screen URLs — one per line (overrides crawl)</span>
            <textarea
              value={screensText}
              onChange={(e) => setScreensText(e.target.value)}
              rows={3}
              disabled={running}
              placeholder={"https://app.example.com/incidents\nhttps://app.example.com/audits/new"}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lab">Max screens — cap on how many screens are discovered / scoped (default 12)</span>
            <input
              type="number"
              min={1}
              value={maxScreens}
              onChange={(e) => setMaxScreens(e.target.value)}
              placeholder="12"
              disabled={running}
            />
          </label>
        </details>
          </div>
        </details>

        <div className="setup-tail">
        {(running || feed.length > 0) && (
          <div className={`activity-feed ${feedOpen ? "" : "collapsed"}`} aria-label="Run activity">
            <div className="activity-feed-head">
              <span className="af-title">{running && <span className="spinner" />} Activity</span>
              <button className="af-toggle" onClick={() => setFeedOpen((o) => !o)} title={feedOpen ? "Hide" : "Show"}>
                {feedOpen ? "▾" : "▸"}
              </button>
            </div>
            {feedOpen && (
              <div className="activity-feed-body" ref={feedBodyRef}>
                {/* Bottom-anchored: newest line sits by the Generate button; older lines stack upward. */}
                <div className="af-lines">
                  {feed.map((f, i) => (
                    <div key={i} className={`activity-item ${f.kind}`}>
                      <span className="t">{formatDuration(f.ms) || "0s"}</span>
                      <span className="ic">{FEED_ICON[f.kind] ?? "·"}</span>
                      <span className="msg">{f.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="btn-row">
          <button className="primary" onClick={run} disabled={running || !url || enabledCount === 0}>
            {running ? "Running…" : "Generate handoff"}
          </button>
          {running && <button className="ghost" onClick={() => abortRef.current?.abort()}>Cancel</button>}
          <label className="notify-toggle" title="Get an OS notification, a tab-title flash, and a chime when the run finishes — so you can work in another tab meanwhile">
            <input
              type="checkbox"
              checked={notifyWhenDone}
              onChange={(e) => {
                const on = e.target.checked;
                setNotifyWhenDone(on);
                if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
                  Notification.requestPermission().catch(() => {});
                }
              }}
            />
            <span>🔔 Notify me when it&rsquo;s done</span>
          </label>
        </div>
        {status && (
          <div className="status">
            <span className="spinner" /> {status}
            {elapsedMs != null && <span className="elapsed"> · {formatDuration(elapsedMs)}</span>}
          </div>
        )}
        {!running && !error && elapsedMs != null && artifacts.length > 0 && (
          <p className="notice">⏱ Completed in {formatDuration(elapsedMs)}</p>
        )}
        {error && <p className="err">Error: {error}</p>}
        {notice && <p className="notice" onClick={() => setNotice("")} title="Dismiss">{notice}</p>}
        {savedRun && (
          <p className="notice">
            ✓ Saved to library{" "}
            <Link className="link-btn" href={`/library?project=${savedRun.project}&run=${savedRun.id}`}>View this run →</Link>
          </p>
        )}
        </div>
      </div>

      {showLoader && (
        <div className="loader-stage" aria-label="Generating handoff" ref={loaderRef}>
          <CubesLoader />
          {status && <p className="loader-caption"><span className="spinner" /> {status}</p>}
        </div>
      )}

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

          <RunOutputs
            brief={brief}
            captures={captures}
            instrumentation={instrumentation}
            artifacts={artifacts}
            framework={framework}
            exporters={exporters}
            selected={selected}
            onSelect={setSelected}
            editable
            onToggleApprove={toggleApprove}
            onEdit={updateArtifact}
            onCopy={copy}
          />
        </div>
      )}
    </div>
  );
}
