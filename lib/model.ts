// Central model configuration.
//
// Models are called through the Anthropic provider DIRECTLY (not the Vercel AI
// Gateway), so usage bills to your Anthropic organisation / enterprise account
// rather than Vercel gateway credits. Authentication uses ANTHROPIC_API_KEY from
// the environment (`.env.local` locally; project env on Vercel). Get a key from
// the Anthropic Console → API keys.
//
// Model IDs are bare first-party strings (e.g. "claude-sonnet-5",
// "claude-opus-4-8"). Override per-stage with HARNESS_MODEL_* if desired.
//
// To revert to the gateway: pass the plain string ids (e.g.
// "anthropic/claude-sonnet-5") to generateText/ToolLoopAgent instead of wrapping
// them in anthropic(), and set AI_GATEWAY_API_KEY.

import { anthropic } from "@ai-sdk/anthropic";

export const MODEL_UNDERSTAND = anthropic(
  process.env.HARNESS_MODEL_UNDERSTAND ?? "claude-sonnet-5",
);

export const MODEL_GENERATE = anthropic(
  process.env.HARNESS_MODEL_GENERATE ?? "claude-sonnet-5",
);
