"use client";

// Holds the entire generator run (the streaming fetch + all its state) in the
// ROOT LAYOUT, so it survives client-side navigation. Previously this lived in
// the page component, so visiting /library unmounted it and killed the run.
import { createContext, useContext, useRef, useState, useEffect, type ReactNode } from "react";
import type { ChangeBrief, PipelineEvent, Capture, SlideSpec, InstrumentationPlan } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { createExporters } from "@/app/lib/exports";
import { DEFAULT_DESIGN_SOURCE } from "@/lib/designSources";
import { DEMO_CASES } from "@/lib/demoCases";

export type UiArtifact = {
  audienceId: string;
  label: string;
  content: string;
  approved: boolean;
  slideSpec?: SlideSpec;
};

// The toggleable outputs, grouped by package, for the pre-run selection step.
export const OUTPUTS: { pkg: string; items: { id: string; label: string }[] }[] = [
  { pkg: "Design system", items: [{ id: "design-system", label: "DS updates + component specs" }] },
  { pkg: "Engineering", items: [{ id: "dev", label: "Developer handoff (spec)" }, { id: "dev-code", label: "Coded component" }] },
  { pkg: "QA", items: [{ id: "qa", label: "QA test cases" }] },
  { pkg: "Documentation & support", items: [{ id: "product-docs", label: "Product docs" }, { id: "support-summary", label: "Support summary" }, { id: "release-notes", label: "Release notes" }] },
  { pkg: "Executive comms", items: [{ id: "one-pager", label: "1-Pager" }, { id: "slide", label: "Slide (.pptx)" }] },
  { pkg: "Case study", items: [{ id: "case-study", label: "Case study" }] },
  { pkg: "Analytics & success", items: [{ id: "analytics-plan", label: "Analytics plan" }] },
];
export const ALL_OUTPUT_IDS = OUTPUTS.flatMap((g) => g.items.map((i) => i.id));

// Leading glyph per activity-feed line kind.
export const FEED_ICON: Record<string, string> = {
  tool: "•", stage: "▸", milestone: "◆", artifact: "✓", done: "✅", error: "⚠", info: "·",
};

function useProvideRun() {
  const [projectName, setProjectName] = useState("");
  const [url, setUrl] = useState("");
  const [designDescription, setDesignDescription] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [designDecisions, setDesignDecisions] = useState("");
  const [baselineUrl, setBaselineUrl] = useState("");
  // An uploaded screenshot of the current app, held as a data URL, used as a
  // visual "before" when the designer has no baseline URL or codebase to diff against.
  const [baselineImage, setBaselineImage] = useState("");
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
  const [setupOpen, setSetupOpen] = useState(true);
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
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Append one line to the live activity feed, stamped with run-elapsed time.
  const pushFeed = (message: string, kind = "info") =>
    setFeed((prev) => [...prev, { ms: Date.now() - startRef.current, message, kind }]);
  const enabledCount = ALL_OUTPUT_IDS.filter((id) => enabled[id]).length;
  // Spin the loader for the whole run; the nav+viewer fills in below it as
  // content streams, and the loader clears when the run completes.
  const showLoader = running;

  const exporters = createExporters({ captures, brief, framework, onError: setError, onNotice: setNotice });

  // Populate every setup field from a pre-built demo case (optional). "None"
  // (custom — no matching case) clears the demo-populated fields back to an
  // empty form for manual entry.
  function applyDemoCase(id: string) {
    setDemoCase(id);
    const c = DEMO_CASES.find((x) => x.id === id);
    setBaselineImage(""); // demo cases use a baseline URL, not an uploaded screenshot
    if (!c) {
      setProjectName(""); setUrl(""); setBaselineUrl(""); setSubject(""); setComponentSelector("");
      setDesignDescription(""); setProjectContext(""); setFocusAreas(""); setDesignDecisions("");
      setDesignSource(DEFAULT_DESIGN_SOURCE); setFramework("vue"); // back to the EHSQ-E DS default
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

  // On Generate, scroll the loader into view (the setup form can push it below the fold).
  useEffect(() => {
    if (showLoader) loaderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [showLoader]);

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
    setSetupOpen(false); // collapse the form fields; the feed + controls stay visible
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
          prototypeUrl: url, baselineUrl, baselineImage, codebasePath, codebaseScope, framework,
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

  return {
    projectName, setProjectName, url, setUrl, designDescription, setDesignDescription,
    projectContext, setProjectContext, focusAreas, setFocusAreas, designDecisions, setDesignDecisions,
    baselineUrl, setBaselineUrl, baselineImage, setBaselineImage, codebasePath, setCodebasePath, codebaseScope, setCodebaseScope,
    demoCase, applyDemoCase, framework, setFramework, designSource, setDesignSource,
    subject, setSubject, componentSelector, setComponentSelector,
    running, status, error, notice, setNotice, brief, captures, instrumentation, artifacts,
    savedRun, elapsedMs, feed, feedOpen, setFeedOpen, setupOpen, setSetupOpen,
    enabled, setEnabled, selected, setSelected, notifyWhenDone, setNotifyWhenDone,
    enabledCount, showLoader, exporters,
    abortRef, feedBodyRef, loaderRef,
    run, updateArtifact, toggleApprove, copy, downloadAll,
  };
}

const Ctx = createContext<ReturnType<typeof useProvideRun> | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const value = useProvideRun();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRun() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRun must be used within RunProvider");
  return v;
}
