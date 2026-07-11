# XuanJi MVP 文档精简设计

## 目标

把 XuanJi 定义为个人开发、快速验证核心价值的 MVP。项目文档只描述排盘、规则、报告、Agent 和日运等主要功能，不为尚未发生的公开运营、多人使用或商业合规预建复杂防线。

## MVP 假设

- 项目由单人开发和使用，暂不建设正式账户体系。
- 首版允许直接进入产品，不使用邀请码、登录、Session、恢复码或管理员权限体系。
- 出生资料和报告按普通业务数据保存，不增加应用层加密、密钥轮换、隐私审批、导出或删除工作流。
- 不建设 Turnstile、CSRF、IDOR、限流、配额、防滥用、红队、事件响应和安全审计体系。
- 不设置 18+、未成年人、地区合规、医疗投资拒答、道德判断或营销审查规则。
- 不建设法务 Gate、SBOM、Threat Model、Dependency Review、许可证审批流程或内容审核后台。

## 保留范围

- 时间、历法、时区、节气、宫位和相位等确定性计算。
- Chart Snapshot、方法配置、规则、Evidence 和结构化报告。
- 八字与西方占星计算模块的清晰边界。
- Cloudflare 单 Worker、TanStack Start、Hono、Agents/Think、D1、R2 和 Durable Objects 的最小运行骨架。
- XuanJi 项目专属 AI Gateway 与统一模型适配层。
- Golden Cases、单元测试、集成测试和基本错误处理，用于保证主要功能可重复运行。
- 模型只解释结构化计算结果，不代替确定性排盘。

## 文档改造

1. 统一项目名称为 `XuanJi`，包作用域使用 `@xuanji/*`，Worker 和资源使用 `xuanji-*`。
2. 统一为单 Worker：`apps/web` 同时承载 TanStack Start、Hono API、Agent 路由和 Scheduled Handler，不创建 `apps/worker`。
3. AI Gateway 不拆分新仓库或中转 Worker；专用 Gateway 的配置、适配器和初始化脚本全部放在 XuanJi。
4. 删除 PRD/TDD 中鉴权、隐私、安全、内容治理、年龄、地区、法律、合规和运营防御章节及其交叉引用。
5. 简化数据模型、API、页面、Backlog、质量 Gate、风险表、Runbook、上线清单和开放问题。
6. 把实施顺序收口为：平台骨架与专用 Gateway → 出生资料与时间 → 首个确定性排盘模块 → 报告与 Agent → 第二模块 → 日运。
7. 重写 README，使其与精简后的 PRD/TDD 一致，不再使用过时的 `iztro`、Token + password、先做 Agent 或一次覆盖全部术数的路线。

## 完成标准

- 文档中不存在 18+、未成年人、鉴权、邀请码、Turnstile、CSRF、IDOR、隐私治理、应用层加密、红队、SBOM、法务审批或内容安全 Gate。
- 架构、Backlog、README 和实施顺序没有相互冲突。
- 文档可以直接指导一个单人 MVP 从空仓库开始开发核心功能。
