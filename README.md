# XuanJi (玄机)

**Professional AI-powered multi-tradition fortune-telling & divination platform**, built entirely on Cloudflare.

XuanJi uses Cloudflare's **Think Agents** harness with modular "skills" to deliver accurate, culturally-grounded, and personalized fortune insights across Eastern and Western traditions — in one unified, professional experience.

## Why XuanJi?

- **玄机 (XuanJi)**: The profound hidden mechanisms of fate. An AI that thinks deeply to reveal patterns across traditions.
- Unified interface with mode selection (not fragmented mini-apps).
- Precise calculations (Bazi, Ziwei) via code + rich AI interpretation.
- Dynamic skill loading for different divination systems.
- Current fortune synthesis (flow years, transits, daily influences).
- Ethical design: entertainment + cultural insight + actionable reflection, never deterministic.

## Core Features

- **Multi-Tradition Support** (modular skills):
  - Eastern: 八字 (Bazi/Four Pillars), 紫微斗数 (Ziwei Doushu), 易经 (I Ching), Chinese Zodiac + annual fortune
  - Western: Zodiac (daily + natal), Tarot (spreads & interpretations)
  - Synthesis mode: Cross-tradition insights
- **Precise Chart Engine**: Uses `iztro` library for accurate Bazi & Ziwei calculations (not LLM hallucination).
- **Current Fortune Awareness**: Date-aware analysis, flow years (流年), planetary influences, personalized to birth data.
- **Think Agent Architecture**:
  - Modular skills (prompt packs) loaded dynamically from R2 or bundled.
  - Tools for calculations, card drawing, lunar date conversion, knowledge retrieval.
  - Persistent sessions, streaming responses, memory.
- **Full-Stack on Cloudflare** (zero server cost):
  - Frontend: TanStack Start
  - Backend: Hono + type-safe RPC
  - AI Layer: Think Agents (Durable Objects + SQLite)
  - Storage: R2 (skills & assets), D1/KV (user data/history)
  - Vectorize for RAG on classic texts (optional advanced)
- **Simple Auth MVP**: Token + password (no email required initially)
- **Professional Output**: Structured readings with tradition basis, personalization, actionable advice, and clear disclaimers.

## Tech Stack

- **Cloudflare Agents (Think harness)** — stateful agentic loop, skills, tools, streaming
- **Hono** + Hono RPC — lightweight, type-safe API
- **TanStack Start** — modern React full-stack frontend (deployed on CF)
- **Workers AI** (Kimi K2 / GLM recommended) — strong Chinese + tool calling
- **iztro** — lightweight JS library for Bazi & Ziwei Doushu
- **Durable Objects + SQLite** — persistent agent state & sessions
- **R2 + Vectorize** — skills storage & knowledge base

## Project Structure (Planned)

```
xuanji/
├─ frontend/          # TanStack Start app
├─ backend/           # Hono + Think Agent (Workers)
├─ skills/            # Modular prompt packs (bazi.md, ziwei.md, tarot.md...)
├─ packages/          # Shared types, utils, iztro wrapper
├─ wrangler.toml
├─ README.md
└─ ...
```

## Getting Started (High-level)

1. Clone the repo
2. `npm install`
3. Configure `wrangler.toml` (AI binding, DO migrations, R2, etc.)
4. Deploy with `wrangler deploy`

Detailed setup guide will be added as we build.

## Roadmap

- [ ] Phase 1: Core Think Agent + one high-value mode (Bazi daily/annual fortune)
- [ ] Phase 2: Add Ziwei, Tarot, Zodiac modes + dynamic skill activation
- [ ] Phase 3: Chart visualization (SVG/react-iztro), history, synthesis mode
- [ ] Phase 4: RAG knowledge base, improved current fortune engine, auth polish
- [ ] Phase 5: Image generation for charts/visuals, public demo

## Philosophy & Professionalism

XuanJi is designed as a **cultural + technological exploration tool**, not a replacement for professional advice or traditional masters.

Every reading includes:
- Basis in traditional theory
- Personalization from user birth data
- Current timing influences
- Balanced view (opportunities + cautions)
- Clear disclaimer

We aim for depth, accuracy where possible (via code), and genuine insight — not generic horoscopes.

## License

To be decided (likely MIT or custom for the project).

## Status

Early planning & architecture phase. Actively building.

---

Built with ❤️ by a solo developer on Cloudflare's edge + AI primitives.

Repository created and initialized with this README on 2026-07-10.