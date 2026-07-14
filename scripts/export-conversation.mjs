#!/usr/bin/env node
// Export the Claude Code session transcripts for THIS project into readable
// Markdown under docs/conversation-log/, so the team has a durable record of
// everything discussed. Re-run any time to refresh:
//
//   node scripts/export-conversation.mjs
//
// Reads the per-session JSONL transcripts Claude Code writes under
// ~/.claude/projects/<project-slug>/ and renders the discussion (user +
// assistant prose, with tool activity summarised). Big tool outputs are
// summarised rather than dumped, so the log reads like a conversation.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const projectDir = process.cwd();
// Claude Code slugifies the cwd (path separators + spaces → dashes).
const slug = projectDir.replace(/[/ ]/g, "-");
const transcriptsDir = join(homedir(), ".claude", "projects", slug);
const outDir = join(projectDir, "docs", "conversation-log");

function truncate(s, n) {
  s = String(s ?? "").replace(/\r/g, "");
  return s.length > n ? s.slice(0, n) + " …[truncated]" : s;
}

// Turn one message's content (string or parts array) into readable Markdown.
function renderContent(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  const out = [];
  for (const part of content) {
    if (part.type === "text" && part.text?.trim()) {
      out.push(part.text.trim());
    } else if (part.type === "tool_use") {
      const input = part.input ?? {};
      let summary = "";
      if (input.command) summary = truncate(input.command, 200);
      else if (input.file_path) summary = input.file_path;
      else if (input.path) summary = input.path;
      else if (input.prompt) summary = truncate(input.prompt, 160);
      else if (input.query) summary = truncate(input.query, 160);
      else summary = truncate(JSON.stringify(input), 160);
      out.push(`> 🔧 **${part.name}** — ${summary}`);
    }
    // tool_result parts (role: user) are execution output — omit from the
    // discussion log to keep it readable.
  }
  return out.join("\n\n").trim();
}

function isToolResultOnly(content) {
  return (
    Array.isArray(content) &&
    content.length > 0 &&
    content.every((p) => p.type === "tool_result")
  );
}

function renderSession(file) {
  const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
  const blocks = [];
  for (const line of lines) {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type !== "user" && ev.type !== "assistant") continue;
    const msg = ev.message;
    if (!msg?.content) continue;
    if (ev.type === "user" && isToolResultOnly(msg.content)) continue; // tool output, not a real turn
    const body = renderContent(msg.content);
    if (!body) continue;
    const who = ev.type === "user" ? "🧑 User" : "🤖 Claude";
    const ts = ev.timestamp ? new Date(ev.timestamp).toISOString().replace("T", " ").slice(0, 16) : "";
    blocks.push(`### ${who}${ts ? ` · ${ts}` : ""}\n\n${body}`);
  }
  return blocks;
}

function main() {
  let files;
  try {
    files = readdirSync(transcriptsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({ f, path: join(transcriptsDir, f), mtime: statSync(join(transcriptsDir, f)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime);
  } catch {
    console.error(`No transcripts found at ${transcriptsDir}`);
    process.exit(1);
  }
  if (!files.length) {
    console.error(`No .jsonl transcripts in ${transcriptsDir}`);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const index = [
    "# Conversation log",
    "",
    "A readable export of the Claude Code sessions for this project, newest last.",
    `Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/export-conversation.mjs\` — re-run to refresh.`,
    "",
    "| Session | Date | Turns |",
    "|---|---|---|",
  ];

  for (const { f, path, mtime } of files) {
    const blocks = renderSession(path);
    if (!blocks.length) continue;
    const sessionId = f.replace(/\.jsonl$/, "");
    const date = new Date(mtime).toISOString().slice(0, 10);
    const name = `${date}_${sessionId.slice(0, 8)}.md`;
    const md = [`# Session ${sessionId.slice(0, 8)} — ${date}`, "", blocks.join("\n\n---\n\n"), ""].join("\n");
    writeFileSync(join(outDir, name), md);
    index.push(`| [${sessionId.slice(0, 8)}](${name}) | ${date} | ${blocks.length} |`);
    console.log(`wrote ${name} (${blocks.length} turns)`);
  }

  writeFileSync(join(outDir, "README.md"), index.join("\n") + "\n");
  console.log(`index → docs/conversation-log/README.md`);
}

main();
