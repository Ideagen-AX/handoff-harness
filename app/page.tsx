"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { ChangeBrief, PipelineEvent, Capture, SlideSpec, InstrumentationPlan } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";
import { formatDuration } from "@/lib/format";
import { createExporters } from "@/app/lib/exports";
import { RunOutputs } from "@/app/components/RunViews";
import ThemeToggle from "@/app/components/ThemeToggle";
import { DESIGN_SOURCES, DEFAULT_DESIGN_SOURCE } from "@/lib/designSources";
import { DEMO_CASES } from "@/lib/demoCases";

type UiArtifact = {
  audienceId: string;
  label: string;
  content: string;
  approved: boolean;
  slideSpec?: SlideSpec;
};

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

// Leading glyph per activity-feed line kind.
const FEED_ICON: Record<string, string> = {
  tool: "•", stage: "▸", milestone: "◆", artifact: "✓", done: "✅", error: "⚠", info: "·",
};

// Required-field indicator: a large red asterisk until a value is present, then a
// teal check-in-a-circle. Value-driven, so demo-case auto-fill flips it too.
function ReqMark({ filled }: { filled: boolean }) {
  return filled ? (
    <span className="req req-done" role="img" aria-label="provided" title="Provided">✓</span>
  ) : (
    <span className="req req-todo" role="img" aria-label="required" title="Required">*</span>
  );
}

export default function Home() {
  const [projectName, setProjectName] = useState("");
  const [url, setUrl] = useState("");
  const [designDescription, setDesignDescription] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [designDecisions, setDesignDecisions] = useState("");
  const [baselineUrl, setBaselineUrl] = useState("");
  const [codebasePath, setCodebasePath] = useState("");
  const [codebaseScope, setCodebaseScope] = useState("");
  const [demoCase, setDemoCase] = useState("custom");
  const [framework, setFramework] = useState("vue");
  const [designSource, setDesignSource] = useState(DEFAULT_DESIGN_SOURCE);
  const [subject, setSubject] = useState("");
  const [componentSelector, setComponentSelector] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [brief, setBrief] = useState<ChangeBrief | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [instrumentation, setInstrumentation] = useState<InstrumentationPlan | null>(null);
  const [artifacts, setArtifacts] = useState<UiArtifact[]>([]);
  const [savedRun, setSavedRun] = useState<{ id: string; project: string } | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [feed, setFeed] = useState<{ ms: number; message: string; kind: string }[]>([]);
  const [feedOpen, setFeedOpen] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(ALL_OUTPUT_IDS.map((id) => [id, true])));
  const [selected, setSelected] = useState<string | null>(null);
  const [notifyWhenDone, setNotifyWhenDone] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const origTitleRef = useRef("");
  const titleFlashedRef = useRef(false);
  const artifactCountRef = useRef(0);
  // Run timer: tick a live elapsed clock while running, frozen to the server's
  // authoritative duration on the `done` event. `terminalRef` records whether a
  // terminal event (done/error) arrived, so a stream that just stops (server
  // timeout) is caught instead of failing silently.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const terminalRef = useRef(false);
  const feedBodyRef = useRef<HTMLDivElement | null>(null);

  // Append one line to the live activity feed, stamped with run-elapsed time.
  const pushFeed = (message: string, kind = "info") =>
    setFeed((prev) => [...prev, { ms: Date.now() - startRef.current, message, kind }]);
  const enabledCount = ALL_OUTPUT_IDS.filter((id) => enabled[id]).length;

  const exporters = createExporters({ captures, brief, framework, onError: setError, onNotice: setNotice });

  // Populate every setup field from a pre-built demo case (optional). "None"
  // (custom — no matching case) clears the demo-populated fields back to an
  // empty form for manual entry.
  function applyDemoCase(id: string) {
    setDemoCase(id);
    const c = DEMO_CASES.find((x) => x.id === id);
    if (!c) {
      setProjectName(""); setUrl(""); setBaselineUrl(""); setSubject(""); setComponentSelector("");
      setDesignDescription(""); setProjectContext(""); setFocusAreas(""); setDesignDecisions("");
      return;
    }
    setProjectName(c.projectName);
    setUrl(c.url);
    setBaselineUrl(c.baselineUrl);
    setSubject(c.subject);
    setComponentSelector(c.componentSelector);
    setDesignDescription(c.designDescription);
    setProjectContext(c.projectContext);
    setFocusAreas(c.focusAreas);
    setDesignDecisions(c.designDecisions);
    setDesignSource(c.designSource);
    setFramework(c.framework);
  }

  // Restore the tab title once you come back to a flashed tab.
  useEffect(() => {
    origTitleRef.current = document.title;
    const onVis = () => {
      if (!document.hidden && titleFlashedRef.current) {
        document.title = origTitleRef.current;
        titleFlashedRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Keep the feed scrolled to the newest line (at the bottom) as it streams.
  useEffect(() => {
    const el = feedBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length]);

  // Called on the Generate click (a user gesture) so we can ask for notification
  // permission and unlock audio for a later chime — both require a gesture.
  function primeNotifications() {
    if (!notifyWhenDone) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audioCtxRef.current = audioCtxRef.current ?? new AC();
        if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      /* audio unavailable */
    }
  }

  // A short two-note chime — rising when done, falling on failure.
  function playChime(ok: boolean) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      (ok ? [660, 880] : [440, 330]).forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const t = now + i * 0.16;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.start(t);
        o.stop(t + 0.34);
      });
    } catch {
      /* ignore */
    }
  }

  // Attention-grab when a run finishes: a chime always, plus an OS notification
  // and a tab-title flash when the tab isn't focused (if it is, the UI updated).
  function notifyComplete(ok: boolean, detail?: string) {
    if (!notifyWhenDone) return;
    playChime(ok);
    if (typeof document === "undefined" || !document.hidden) return;
    const title = ok ? "✅ Handoff ready" : "⚠️ Run failed";
    const n = artifactCountRef.current;
    const body = ok
      ? `${n} output${n === 1 ? "" : "s"} for “${projectName}” ready to review.`
      : detail?.slice(0, 140) || "The run didn’t finish — check the app.";
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const note = new Notification(title, { body, tag: "handoff-run" });
        note.onclick = () => {
          window.focus();
          note.close();
        };
      } catch {
        /* ignore */
      }
    }
    document.title = `${ok ? "✅" : "⚠️"} ${origTitleRef.current}`;
    titleFlashedRef.current = true;
  }

  async function run() {
    setRunning(true);
    setError(""); setNotice("");
    setBrief(null); setCaptures([]); setInstrumentation(null); setArtifacts([]); setSavedRun(null);
    setSelected(null);
    setStatus("Starting…");
    setElapsedMs(0);
    setFeed([]);
    setFeedOpen(true);
    artifactCountRef.current = 0;
    terminalRef.current = false;
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 1000);
    primeNotifications();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prototypeUrl: url, baselineUrl, codebasePath, codebaseScope, framework,
          enabledOutputs: ALL_OUTPUT_IDS.filter((id) => enabled[id]),
          subject, componentSelector,
          projectName, designDescription, projectContext, focusAreas, designDecisions, designSource,
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
      // The stream ended cleanly but no `done`/`error` arrived — the server was
      // cut off mid-run (almost always the function's maxDuration timeout). Don't
      // fail silently: the last artifact(s) are missing and nothing was saved.
      if (!terminalRef.current) {
        const msg = "The run ended early — the server stopped before finishing (likely a timeout). Some outputs may be missing, and this run was not saved to the library. Try again, or generate fewer outputs at once.";
        setError(msg);
        pushFeed("Run ended early — server stopped (likely a timeout)", "error");
        notifyComplete(false, msg);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(String(e));
        notifyComplete(false, String(e));
      }
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setRunning(false);
      setStatus("");
      abortRef.current = null;
    }
  }

  function handleEvent(ev: PipelineEvent) {
    switch (ev.type) {
      case "status": setStatus(ev.message); break;
      case "activity": pushFeed(ev.message, ev.kind ?? "info"); break;
      case "brief": setBrief(ev.brief); setSelected((s) => s ?? "brief"); break;
      case "captures": setCaptures(ev.captures); break;
      case "instrumentation": setInstrumentation(ev.plan); break;
      case "artifact":
        artifactCountRef.current += 1;
        setArtifacts((prev) => [...prev, { ...ev.artifact, approved: false }]);
        setSelected((s) => s ?? ev.artifact.audienceId);
        pushFeed(`✓ ${ev.artifact.label}`, "artifact");
        break;
      case "error":
        terminalRef.current = true;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setError(ev.message); pushFeed(ev.message, "error"); notifyComplete(false, ev.message);
        break;
      case "done":
        terminalRef.current = true;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (typeof ev.durationMs === "number") setElapsedMs(ev.durationMs);
        setStatus("");
        if (ev.savedRunId && ev.project) setSavedRun({ id: ev.savedRunId, project: ev.project });
        pushFeed(`Done in ${formatDuration(typeof ev.durationMs === "number" ? ev.durationMs : Date.now() - startRef.current)}`, "done");
        notifyComplete(true);
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
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Praxis Toolbar" disabled={running} />
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
