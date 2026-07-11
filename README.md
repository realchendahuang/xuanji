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
- Workers AI through a project-specific AI Gateway

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
        -> Workers AI / optional external provider
```

## Dedicated AI Gateway

Every deployment uses its own Cloudflare AI Gateway. The default Gateway ID is `xuanji`.

The Gateway remains a Cloudflare account resource, while all integration code, configuration examples, and setup scripts live in this repository. No second Gateway repository or proxy Worker is required.

Runtime configuration:

```text
AI_GATEWAY_ID=xuanji
AI_PROVIDER=workers-ai
AI_MODEL=<locked-project-model>
AI_FALLBACK_MODEL=<optional-model>
```

Cloudflare and provider credentials are supplied by the deployment environment.

## Planned repository structure

```text
xuanji/
├── apps/
│   └── web/                 TanStack Start + Worker entry
├── packages/
│   ├── api/                 Hono routes and RPC types
│   ├── contracts/           Zod schemas and DTOs
│   ├── db/                  D1 repositories
│   ├── domain-time/         timezone and civil-time normalization
│   ├── domain-bazi/         deterministic BaZi engine
│   ├── domain-astrology/    Western chart engine, later phase
│   ├── rules/               evidence-producing rule engine
│   ├── ai/                  AI Gateway and model adapters
│   ├── agent/               XuanJiAgent and tools
│   ├── skills/              interpretation knowledge packages
│   ├── report/              report contracts and rendering
│   ├── ui/                  shared components
│   └── evals/               golden cases and model evals
├── migrations/
├── scripts/
├── docs/
├── wrangler.jsonc
└── pnpm-workspace.yaml
```

All internal packages use the `@xuanji/*` scope.

## Build order

1. Monorepo and single Worker skeleton
2. Dedicated AI Gateway adapter and preview call
3. Birth profile and time normalization
4. Deterministic BaZi chart and golden cases
5. Rules, evidence, reports, and Agent chat
6. Western astrology
7. Daily readings and exports

## Documentation

- [MVP PRD and TDD](docs/ai-fortune-cloudflare-prd-tdd-v1.0.md)
- [Lean MVP documentation scope](docs/superpowers/specs/2026-07-11-mvp-document-simplification-design.md)
- [Dedicated AI Gateway design](docs/superpowers/specs/2026-07-11-dedicated-ai-gateway-design.md)

## Status

The product and technical baseline are ready. Implementation starts with the single-Worker platform skeleton and the dedicated AI Gateway path.
