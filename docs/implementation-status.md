# XuanJi MVP implementation status

This file maps the executable P0 baseline in `ai-fortune-cloudflare-prd-tdd-v1.0.md` to current evidence.

| Requirement                  | Implementation evidence                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Single Worker                | TanStack Start, Hono and Think are composed by `apps/web/src/server.ts` and deployed as Worker `xuanji`.              |
| Dedicated AI Gateway         | `AI_GATEWAY_ID=xuanji`; production calls use `DeepSeekGatewayAdapter` and `deepseek-v4-flash`.                        |
| Birth profile CRUD           | POST/GET/list/PATCH APIs plus immutable `birth_profile_versions`.                                                     |
| Time normalization           | Temporal-based IANA timezone, UTC offset, DST rejection/disambiguation, unknown-time noon and true-solar correction.  |
| Explicit methodology         | Lichun/lunar-new-year, 23:00/00:00 day boundary, civil/true-solar and luck-cycle version are stored in each Snapshot. |
| Deterministic BaZi           | Four pillars, visible elements, hidden stems, ten gods, lunar text, zodiac and eight decade-fortune ranges.           |
| Immutable Snapshot           | Input hash, engine/version, methodology, normalized time and facts are stored in D1.                                  |
| Rules and evidence           | 35-rule `bazi-core-1.0.0` pack; every Evidence has rule/version/fact references.                                      |
| Structured report            | Summary, Claims and Evidence; Claims/Evidence also have normalized D1 tables.                                         |
| Streaming AI                 | `/api/v1/readings/stream` emits SSE status and the completed DeepSeek V4 Flash report through Gateway `xuanji`.       |
| Stateful follow-up           | Think `XuanJiAgent` is bound to a Durable Object and exposes five domain tools.                                       |
| History and dedicated routes | `/history`, `/profiles/new`, `/profiles/:id/edit`, `/chart/bazi/:id`, `/reading/:id`, `/chat/:id`, `/methodology`.    |
| Tests                        | Golden calculation, DST, true-solar, rule, model-adapter, D1 repository and Hono contract tests.                      |
| Open-source deployment       | Wrangler config, `.dev.vars.example`, Gateway setup script, migrations, README and GitHub CI.                         |

P1 features such as Western astrology, daily readings, SVG, share images and PDF remain intentionally outside the P0 completion boundary.
