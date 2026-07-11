# XuanJi 专用 AI Gateway 设计

## 决策

XuanJi 使用项目专属的 Cloudflare AI Gateway。Gateway 是 XuanJi 在部署者 Cloudflare 账户中的一项资源，不拆成独立代码仓库，也不增加额外的中转 Worker。

默认 Gateway ID 为 `xuanji`。部署者可以通过环境变量覆盖该值，但每个部署实例应使用自己的 Gateway，避免与其他应用混用调用统计、缓存和模型配置。

## 调用路径

```text
Browser
  -> XuanJi Worker
     -> XuanJiAgent / AI adapter
        -> env.AI.gateway(AI_GATEWAY_ID)
           -> Workers AI or configured external provider
```

## 仓库范围

仓库包含：

- Workers AI binding。
- `AI_GATEWAY_ID`、默认模型和 Provider 配置。
- `packages/ai` 中的统一模型调用适配层。
- 创建或连接专用 Gateway 的脚本与文档。
- 本地开发配置示例。
- Gateway 调用、流式输出和失败回退测试。

仓库不保存 Cloudflare API Token、Provider API Key 或其他部署凭据。凭据在部署时使用 Cloudflare Secrets 或部署环境提供。

## 运行配置

```text
AI_GATEWAY_ID=xuanji
AI_PROVIDER=workers-ai
AI_MODEL=<project-default-model>
AI_FALLBACK_MODEL=<optional-fallback-model>
```

Workers AI 通过 Worker 的 `AI` binding 调用。外部 Provider 通过 AI Gateway Universal Endpoint 或适配器调用，Provider Key 只从运行环境读取。

## 开源部署

开源用户克隆同一个 XuanJi 仓库后：

1. 在自己的 Cloudflare 账户创建名为 `xuanji` 的 AI Gateway，或运行仓库提供的初始化脚本。
2. 配置 Worker 的 `AI` binding。
3. 设置 Gateway ID 和所需 Provider Secret。
4. 部署同一个 XuanJi Worker。

不要求部署者另建 Gateway 项目或维护第二套代码。

## 完成标准

- 所有生产模型调用都经过项目专属 Gateway。
- 切换模型或 Provider 不影响 Agent 和领域代码。
- 本地测试可以使用 mock adapter，不依赖真实 Gateway。
- 新部署者只需要当前仓库和自己的 Cloudflare 账户即可完成部署。
