import type { Capture, ChangeBrief, SlideSpec } from "@/lib/types";

// Per-output export/download options. Every artifact also gets Approve + Copy
// (rendered separately). Rendered in EXPORT_ORDER, filtered to each output's set.
export const EXPORTS: Record<string, string[]> = {
  "design-system": ["md", "pdf", "docx", "email", "jira"],
  dev: ["md", "pdf", "docx", "jira"],
  "dev-code": ["js", "jira"],
  qa: ["md", "pdf", "docx", "email", "jira"],
  "product-docs": ["md", "pdf", "docx", "email"],
  "support-summary": ["md", "pdf", "docx", "email"],
  "release-notes": ["md", "pdf", "docx", "email"],
  slide: ["pptx", "pdf", "html", "email"],
  "one-pager": ["md", "pdf", "docx", "email"],
  "case-study": ["md", "pdf", "docx", "email"],
  "analytics-plan": ["md", "pdf", "docx", "email"],
};
export const EXPORT_ORDER = ["pptx", "js", "pdf", "html", "docx", "md", "email", "jira"];
export const EXPORT_LABEL: Record<string, string> = {
  pptx: ".pptx", md: ".md", pdf: "PDF", html: "HTML", docx: "Word", email: "Email", jira: "Jira",
};

// Net-new component specs (component-*) are a design-system deliverable.
export function exportsFor(id: string): string[] {
  if (EXPORTS[id]) return EXPORTS[id];
  if (id.startsWith("component-")) return ["md", "pdf", "docx", "email", "jira"];
  return ["md", "pdf", "docx"];
}
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artifact";
}
// Pull the code out of the dev-code Markdown (fenced blocks), falling back to the
// whole content. Extension follows the chosen framework.
export function extractCode(md: string): string {
  const blocks = [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\s+$/, ""));
  return blocks.length ? blocks.join("\n\n") : md;
}
export function codeExt(framework: string): string {
  return ({ vue: "vue", react: "jsx", svelte: "svelte", angular: "ts" } as Record<string, string>)[
    (framework || "").toLowerCase()
  ] ?? "js";
}

export type ArtifactLike = { audienceId: string; label: string; content: string; slideSpec?: SlideSpec };

// Builds the download/export handlers shared by the generator and library pages.
// Closes over the current run context (captures/brief/framework) and reports
// failures/notices through callbacks so each page renders them its own way.
export function createExporters(ctx: {
  captures: Capture[];
  brief: ChangeBrief | null;
  framework: string;
  onError: (s: string) => void;
  onNotice: (s: string) => void;
}) {
  async function saveBlob(res: Response, fallbackName: string) {
    if (!res.ok) {
      ctx.onError(`Download failed: ${await res.text().catch(() => res.statusText)}`);
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    triggerDownload(blob, m?.[1] || fallbackName);
  }
  function saveLocalBlob(content: BlobPart, name: string, type = "text/plain;charset=utf-8") {
    triggerDownload(new Blob([content], { type }), name);
  }
  function triggerDownload(blob: Blob, name: string) {
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
  }
  function post(url: string, body: unknown) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  return {
    async downloadDeck(a: ArtifactLike) {
      if (!a.slideSpec) return;
      try { await saveBlob(await post("/api/deck", { slideSpec: a.slideSpec, captures: ctx.captures }), "slide.pptx"); } catch (e) { ctx.onError(String(e)); }
    },
    async downloadSlidePdf(a: ArtifactLike) {
      if (!a.slideSpec) return;
      try { await saveBlob(await post("/api/slide-pdf", { slideSpec: a.slideSpec, captures: ctx.captures }), "slide.pdf"); } catch (e) { ctx.onError(String(e)); }
    },
    async downloadSlideHtml(a: ArtifactLike) {
      if (!a.slideSpec) return;
      try { await saveBlob(await post("/api/slide-html", { slideSpec: a.slideSpec, captures: ctx.captures }), "slide.html"); } catch (e) { ctx.onError(String(e)); }
    },
    async downloadExport(a: ArtifactLike, format: "pdf" | "docx") {
      try { await saveBlob(await post("/api/export", { format, title: a.label, content: a.content }), `${slugify(a.audienceId)}.${format}`); } catch (e) { ctx.onError(String(e)); }
    },
    downloadMd(a: ArtifactLike) {
      saveLocalBlob(a.content, `${slugify(a.audienceId)}.md`, "text/markdown;charset=utf-8");
    },
    downloadCode(a: ArtifactLike) {
      saveLocalBlob(extractCode(a.content), `component.${codeExt(ctx.framework)}`);
    },
    jiraStub(a: ArtifactLike) {
      ctx.onError("");
      ctx.onNotice(`Jira export for “${a.label}” is stubbed — the integration isn’t wired up yet.`);
    },
    async emailDraft(a: ArtifactLike) {
      try {
        await saveBlob(await post("/api/email", {
          artifact: { audienceId: a.audienceId, label: a.label, content: a.content },
          changeTitle: ctx.brief?.title,
          slideSpec: a.slideSpec,
          captures: a.audienceId === "slide" ? ctx.captures : undefined,
        }), `${a.audienceId}-draft.eml`);
      } catch (e) { ctx.onError(String(e)); }
    },
    async briefExport(format: "md" | "pdf" | "docx") {
      if (!ctx.brief) return;
      try { await saveBlob(await post("/api/brief-export", { format, brief: ctx.brief }), `change-brief.${format}`); } catch (e) { ctx.onError(String(e)); }
    },
    async downloadCapture(c: Capture) {
      if (!c.ok || !c.url) return;
      try { const res = await fetch(c.url); saveLocalBlob(await res.blob(), `${slugify(c.screenKey)}.png`, "image/png"); } catch (e) { ctx.onError(String(e)); }
    },
    async downloadCapturesZip() {
      try { await saveBlob(await post("/api/captures-zip", { captures: ctx.captures }), "screenshots.zip"); } catch (e) { ctx.onError(String(e)); }
    },
    // Dispatch a single export capability for an artifact.
    run(cap: string, a: ArtifactLike) {
      if (cap === "pptx") return this.downloadDeck(a);
      if (cap === "html") return this.downloadSlideHtml(a);
      if (cap === "js") return this.downloadCode(a);
      if (cap === "md") return this.downloadMd(a);
      if (cap === "pdf") return a.audienceId === "slide" ? this.downloadSlidePdf(a) : this.downloadExport(a, "pdf");
      if (cap === "docx") return this.downloadExport(a, "docx");
      if (cap === "email") return this.emailDraft(a);
      if (cap === "jira") return this.jiraStub(a);
    },
  };
}
export type Exporters = ReturnType<typeof createExporters>;
