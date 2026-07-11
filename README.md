# XuanJi（玄机）

XuanJi is an open-source AI fortune-reading platform built as a single Cloudflare full-stack application.

The MVP starts with one complete path: deterministic BaZi calculation, structured evidence, AI-generated reading, and follow-up chat. Western astrology and daily readings come after the first path is stable.

## Core idea

XuanJi separates calculation from interpretation:

1. Deterministic TypeScript tools calculate chart facts.
2. Versioned rules turn facts into evidence.
3. AI organizes facts and evidence into a readable report.
4. Follow-up chat stays bound to the original immutable chart snapshot.

The model does not calculate pillars, solar terms, houses, or aspects.

## MVP

- Birth profile and civil-time normalization
- BaZi chart calculation
- Immutable chart snapshots
- Rule and evidence engine
- Structured AI readings
- Streaming follow-up chat
- Reading history
- Golden cases and deterministic tests
- Dedicated Cloudflare AI Gateway

Not included in the first MVP: payments, admin systems, generalized RAG, or multiple divination systems at once.

## Architecture

One Cloudflare Worker handles the full application:

- TanStack Start for pages and SSR
- Hono + Hono RPC for business APIs
- Cloudflare Agents + `@cloudflare/think` for stateful chat
- D1 for profiles, chart snapshots, rules, and readings
- Durable Object SQLite for Agent conversations
- R2 for skills and generated assets
- KV / Cache API for public daily content
- DeepSeek through a project-specific AI Gateway

```text
Browser
  -> XuanJi Worker
     ├─ TanStack Start
     ├─ Hono API
     ├─ XuanJiAgent
     └─ deterministic chart tools

XuanJiAgent
  -> packages/ai
     -> dedicated XuanJi AI Gateway
        -> DeepSeek V4 Flash
```

## Dedicated AI Gateway

Every deployment uses its own Cloudflare AI Gateway. The default Gateway ID is `xuanji`.

The Gateway remains a Cloudflare account resource, while all integration code, configuration examples, and setup scripts live in this repository. No second Gateway repository or proxy Worker is required.

Runtime configuration:

```text
AI_GATEWAY_ID=xuanji
AI_PROVIDER=deepseek
AI_MODEL=deepseek-v4-flash
```

Production uses a DeepSeek API token stored as the Cloudflare Worker secret `DEEPSEEK_API_KEY`. Both reports and follow-up chat go through Gateway `xuanji`; Cloudflare Workers AI is not used.

## Repository structure

```text
xuanji/
├── apps/
│   └── web/
│       ├── agents/          stateful XuanJi Think agent
│       ├── migrations/      D1 schema
│       └── src/             UI, API, domain rules, Worker entry
├── docs/
└── pnpm-workspace.yaml
```

The MVP deliberately stays in one application package. Modules can be extracted only when a second real consumer appears.

## Local development

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm --dir apps/web test
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

Deploy after authenticating Wrangler:

```bash
cp apps/web/.dev.vars.example apps/web/.dev.vars
pnpm setup:gateway
pnpm --dir apps/web exec wrangler d1 migrations apply xuanji --remote
pnpm --dir apps/web run deploy
```

`setup:gateway` expects `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; it is idempotent and keeps the Gateway in the same Cloudflare account as the Worker.

Dedicated Cloudflare resources used by production:

- Worker: `xuanji`
- AI Gateway: `xuanji`
- D1: `xuanji`
- R2: `xuanji-assets`, `xuanji-skills`
- KV: `PUBLIC_CACHE`

Production: [xuanji.chendanhuang31016.workers.dev](https://xuanji.chendanhuang31016.workers.dev)

## Documentation

- [MVP PRD and TDD](docs/ai-fortune-cloudflare-prd-tdd-v1.0.md)
- [Lean MVP documentation scope](docs/superpowers/specs/2026-07-11-mvp-document-simplification-design.md)
- [Dedicated AI Gateway design](docs/superpowers/specs/2026-07-11-dedicated-ai-gateway-design.md)
- [Implementation status and evidence](docs/implementation-status.md)

## Status

The first complete BaZi MVP path is implemented and deployed: birth profile, deterministic four-pillar calculation, evidence, AI reading through the dedicated Gateway, history, and stateful follow-up chat.
