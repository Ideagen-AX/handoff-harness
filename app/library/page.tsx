"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { StoredRun, StoredRunMeta } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";
import { createExporters } from "@/app/lib/exports";
import { ArtifactCard, BriefCard, CaptureGallery, InstrumentationPanel } from "@/app/components/RunViews";

type Group = { project: { id: string; name: string }; runs: StoredRunMeta[] };

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function LibraryPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [run, setRun] = useState<StoredRun | null>(null);
  const [compareWith, setCompareWith] = useState<StoredRun | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setGroups(data.projects ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const openRun = useCallback(async (project: string, id: string, asCompare = false) => {
    try {
      const res = await fetch(`/api/library/run?project=${encodeURIComponent(project)}&id=${encodeURIComponent(id)}`);
      if (!res.ok) { setError("Run not found"); return; }
      const data = await res.json();
      if (asCompare) setCompareWith(data.run as StoredRun);
      else setRun(data.run as StoredRun);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    loadList();
    // Deep link: /library?project=&run=
    const q = new URLSearchParams(window.location.search);
    const p = q.get("project"), r = q.get("run");
    if (p && r) openRun(p, r);
  }, [loadList, openRun]);

  async function del(project: string, id: string) {
    if (!confirm("Delete this run from the library? This removes its files.")) return;
    await fetch(`/api/library/run?project=${encodeURIComponent(project)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (run?.id === id) setRun(null);
    if (compareWith?.id === id) setCompareWith(null);
    loadList();
  }

  const totalRuns = groups.reduce((n, g) => n + g.runs.length, 0);

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="topbar">
          <div className="kicker">Design Handoff Harness <span className="ver">v{APP_VERSION}</span></div>
          <nav className="topnav">
            <Link href="/">← Generator</Link>
            <span className="topnav-active">Library</span>
          </nav>
        </div>
        <h1>Handoff library</h1>
        <p>Every generated run, archived and grouped by design project — {totalRuns} run{totalRuns === 1 ? "" : "s"} across {groups.length} project{groups.length === 1 ? "" : "s"}. Open one to review, or compare two runs of the same project.</p>
      </header>

      {error && <p className="err">Error: {error}</p>}
      {notice && <p className="notice" onClick={() => setNotice("")}>{notice}</p>}

      <div className="workspace">
        <nav className="card nav">
          <div className="nav-head">Projects</div>
          {loading ? (
            <div className="meta" style={{ padding: 12 }}>Loading…</div>
          ) : !groups.length ? (
            <div className="meta" style={{ padding: 12 }}>No runs yet. Generate one and it&rsquo;ll appear here.</div>
          ) : (
            groups.map((g) => (
              <div key={g.project.id} className="nav-group">
                <div className="nav-group-title">{g.project.name}</div>
                {g.runs.map((r) => (
                  <div key={r.id} className={`lib-run ${run?.id === r.id ? "active" : ""}`}>
                    <button className="nav-item lib-run-main" onClick={() => (compareMode ? openRun(g.project.id, r.id, true) : openRun(g.project.id, r.id))}>
                      <span className="nav-item-label">{r.title}</span>
                      <span className="lib-run-meta">v{r.version} · {fmtDate(r.createdAt)} · {r.artifactCount} outputs</span>
                    </button>
                    <button className="lib-del" title="Delete run" onClick={() => del(g.project.id, r.id)}>✕</button>
                  </div>
                ))}
              </div>
            ))
          )}
          {run && (
            <label className="out-check" style={{ marginTop: 14 }}>
              <input type="checkbox" checked={compareMode} onChange={(e) => { setCompareMode(e.target.checked); if (!e.target.checked) setCompareWith(null); }} />
              <span>Compare mode — click another run</span>
            </label>
          )}
        </nav>

        <section className="viewer">
          {!run ? (
            <div className="viewer-empty">Select a run on the left to view it.</div>
          ) : compareWith ? (
            <CompareView a={run} b={compareWith} />
          ) : (
            <RunView run={run} onError={setError} onNotice={setNotice} />
          )}
        </section>
      </div>
    </div>
  );
}

// Full read-only view of one stored run.
function RunView({ run, onError, onNotice }: { run: StoredRun; onError: (s: string) => void; onNotice: (s: string) => void }) {
  const exporters = createExporters({ captures: run.captures, brief: run.brief, framework: run.input?.framework || "vue", onError, onNotice });
  return (
    <div>
      <div className="card run-header">
        <h2>{run.title}</h2>
        <div className="meta">
          {run.project.name} · v{run.version} · {fmtDate(run.createdAt)}
          {run.prototypeUrl ? <> · <a href={run.prototypeUrl} target="_blank" rel="noreferrer">prototype</a></> : null}
          {run.baselineUrl ? <> · <a href={run.baselineUrl} target="_blank" rel="noreferrer">baseline</a></> : null}
        </div>
        {run.input?.designDescription && <p style={{ marginTop: 10 }}>{run.input.designDescription}</p>}
      </div>

      <div className="btn-row" style={{ margin: "6px 0 12px" }}>
        <button className="ghost" onClick={() => exporters.briefExport("pdf")}>Brief PDF</button>
        <button className="ghost" onClick={() => exporters.briefExport("docx")}>Brief Word</button>
        <button className="ghost" onClick={() => exporters.briefExport("md")}>Brief .md</button>
      </div>

      {run.brief && <BriefCard brief={run.brief} />}
      {run.instrumentation && run.instrumentation.points?.length > 0 && <InstrumentationPanel plan={run.instrumentation} />}
      {run.captures?.some((c) => c.ok) && (
        <CaptureGallery captures={run.captures} onDownloadOne={exporters.downloadCapture} onDownloadAll={exporters.downloadCapturesZip} />
      )}
      {run.artifacts?.map((a) => (
        <div key={a.audienceId} style={{ marginTop: 14 }}>
          <ArtifactCard artifact={a} framework={run.input?.framework || "vue"} exporters={exporters} />
        </div>
      ))}
    </div>
  );
}

// Lightweight side-by-side comparison of two runs.
function CompareView({ a, b }: { a: StoredRun; b: StoredRun }) {
  const col = (r: StoredRun) => (
    <div className="card">
      <h3>{r.title}</h3>
      <div className="meta">v{r.version} · {fmtDate(r.createdAt)}</div>
      <dl>
        <dt>One-liner</dt>
        <dd>{r.brief?.oneLiner}</dd>
        <dt>What changed</dt>
        <dd><ul>{r.brief?.whatChanged?.map((x, i) => <li key={i}>{x}</li>)}</ul></dd>
        <dt>Outputs</dt>
        <dd>{r.artifacts?.length ?? 0} · {(r.captures ?? []).filter((c) => c.ok).length} screens</dd>
        <dt>Description</dt>
        <dd>{r.input?.designDescription || <span className="empty">—</span>}</dd>
      </dl>
    </div>
  );
  return (
    <div>
      <div className="meta" style={{ marginBottom: 10 }}>Comparing two runs of <strong>{a.project.name}</strong>. Uncheck compare mode to return to the single view.</div>
      <div className="compare-grid">{col(a)}{col(b)}</div>
    </div>
  );
}
