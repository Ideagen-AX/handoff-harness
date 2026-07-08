"use client";

import { useRef, useState } from "react";
import type { ChangeBrief, PipelineEvent } from "@/lib/types";

type UiArtifact = {
  audienceId: string;
  label: string;
  content: string;
  approved: boolean;
};

export default function Home() {
  const [url, setUrl] = useState("https://responsive-search.vercel.app/");
  const [note, setNote] = useState(
    "We made the search results view responsive and added multiple view modes.",
  );
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [brief, setBrief] = useState<ChangeBrief | null>(null);
  const [artifacts, setArtifacts] = useState<UiArtifact[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    setRunning(true);
    setError("");
    setBrief(null);
    setArtifacts([]);
    setStatus("Starting…");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prototypeUrl: url, note }),
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
        break;
      case "artifact":
        setArtifacts((prev) => [
          ...prev,
          { ...ev.artifact, approved: false },
        ]);
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
        <div className="btn-row">
          <button className="primary" onClick={run} disabled={running || !url}>
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
      </div>

      {brief && <BriefCard brief={brief} />}

      {artifacts.length > 0 && (
        <>
          <div className="section-title">
            Drafts for review · {artifacts.filter((a) => a.approved).length}/{artifacts.length} approved
          </div>
          {artifacts.map((a) => (
            <div key={a.audienceId} className={`card artifact ${a.approved ? "approved" : ""}`}>
              <div className="artifact-head">
                <h3>{a.label}</h3>
                {a.approved && <span className="approved-tag">✓ Approved</span>}
              </div>
              <textarea
                value={a.content}
                onChange={(e) => updateArtifact(a.audienceId, e.target.value)}
              />
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className={a.approved ? "" : "primary"} onClick={() => toggleApprove(a.audienceId)}>
                  {a.approved ? "Unapprove" : "Approve"}
                </button>
                <button className="ghost" onClick={() => copy(a.content)}>
                  Copy
                </button>
                <span className="meta">Sending is stubbed in this build — approve then copy into the channel.</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
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
