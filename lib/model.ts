// Central model configuration.
//
// A plain "provider/model" string is resolved through the Vercel AI Gateway by
// the AI SDK — no provider package needed. On Vercel this authenticates via
// OIDC automatically; locally it uses AI_GATEWAY_API_KEY from .env.local.
//
// Model IDs verified live against the gateway. Bump UNDERSTAND to
// "anthropic/claude-opus-4.8" if you want deeper reasoning on the change brief.

export const MODEL_UNDERSTAND =
  process.env.HARNESS_MODEL_UNDERSTAND ?? "anthropic/claude-sonnet-5";

export const MODEL_GENERATE =
  process.env.HARNESS_MODEL_GENERATE ?? "anthropic/claude-sonnet-5";
