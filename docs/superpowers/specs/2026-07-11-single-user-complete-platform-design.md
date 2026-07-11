# XuanJi 单人自用全功能平台设计

## 1. 决策与边界

XuanJi 定位为仅供所有者本人使用的完整命理工具箱。系统继续采用单个 Cloudflare Worker 的模块化单体架构，以最低的部署和维护成本提供完整功能。

部署在 `xuanji.chendahuang.com`，由 Cloudflare Access 在应用外层执行邮箱白名单认证。应用内部不建设账户、密码、角色、会员、支付、配额、租户、运营后台、审核后台或多人协作能力。

## 2. 功能范围

### 2.1 出生资料与历史

- 保存、编辑和查看出生资料。
- 地点搜索后保存真实经纬度、IANA 时区和标准化时间，不允许地点名称与坐标静默不一致。
- 保存不可变的计算 Snapshot、方法版本、规则版本和输入哈希。
- 按资料、术数和时间浏览历史结果并恢复原对话。

### 2.2 八字

- 四柱、藏干、十神、五行、生肖、农历文本和大运。
- 立春或农历新年换年、23:00 或 00:00 换日、民用时或真太阳时。
- 版本化规则、Evidence、结构化解读、SVG 命盘和当前/每日提示。

### 2.3 西方占星

- Tropical 与 Sidereal 本命盘。
- 行星、星座、宫位、主要相位、交点和逆行状态。
- Whole Sign 与 Placidus 宫制。
- 当前行运、行运行星与本命盘相位、结构化 Evidence。
- 可读列表与 SVG 星盘。

### 2.4 紫微斗数

- 十二宫、命宫/身宫、主星与核心辅星、四化和大限。
- 所有计算产物进入版本化 Snapshot，AI 只解释计算结果。
- 十二宫 SVG 盘、Evidence 和结构化报告。

### 2.5 塔罗

- 单牌、三牌和凯尔特十字牌阵。
- 使用可审计的随机种子完成抽牌、正逆位和牌位分配。
- 保存问题、牌阵、抽牌结果、解读和追问记录。

### 2.6 易经

- 支持六爻数字起卦和随机起卦。
- 保存本卦、动爻、变卦、上下卦、卦辞与爻辞引用。
- 计算和文本事实先确定，AI 负责结合问题组织解读。

### 2.7 合盘与综合报告

- 任意两份出生资料生成八字合盘与西方占星合盘。
- 综合报告聚合已存在的八字、西占和紫微 Snapshot，不允许 AI 补算缺失系统。
- 输出共同主题、互补点、张力、证据引用和可继续追问的上下文。

### 2.8 日运、分享与导出

- 日运按本人档案和日期按需生成，结果缓存到 KV/D1；不建设公开内容定时运营系统。
- 报告页可生成可下载的 SVG、分享图片和 PDF。
- 导出文件写入 R2 并返回受 Cloudflare Access 保护的下载地址。

## 3. 架构

```text
Cloudflare Access
  -> XuanJi Worker
     ├─ TanStack Start UI
     ├─ Hono API
     ├─ D1 repository
     ├─ XuanJiAgent Durable Object
     ├─ deterministic domain engines
     │  ├─ bazi
     │  ├─ western astrology / transit
     │  ├─ ziwei
     │  ├─ tarot
     │  └─ iching
     ├─ report / compatibility orchestration
     ├─ SVG / image / PDF export
     └─ DeepSeek through XuanJi AI Gateway
```

领域计算模块只接收规范化输入并返回带版本的 Facts。规则模块把 Facts 转成 Claims 与 Evidence。AI 模块只接收这些结构化结果，不直接推算命盘、星盘、卦象或牌面。

## 4. 数据模型

D1 增加统一结果层：

- `divination_snapshots`：术数类型、输入、Facts、方法版本、引擎版本和输入哈希。
- `reports`：报告类型、关联 Snapshot、Claims、Evidence、AI 摘要和模型信息。
- `daily_readings`：档案、日期、来源 Snapshot、结构化结果和缓存键。
- `questions`：塔罗/易经问题和起局参数。
- `compatibility_cases`：双方资料、关联 Snapshot 和综合报告。
- `exports`：格式、R2 key、内容哈希和生成时间。

现有八字表保持兼容，并通过统一读取层纳入历史页面，避免破坏已上线数据。

## 5. 页面与交互

- `/`：个人工作台，显示快捷入口、今日提示和最近结果。
- `/profiles`：出生资料列表。
- `/profiles/new`、`/profiles/:id/edit`：资料录入与地点解析。
- `/bazi/:profileId`、`/western/:profileId`、`/ziwei/:profileId`：各系统生成流程。
- `/transits/:profileId`、`/daily/:profileId`：当前行运和每日提示。
- `/tarot`、`/iching`：独立占问流程。
- `/compatibility`：选择两份资料并生成合盘。
- `/report/:reportId`：统一报告、证据、聊天与导出。
- `/history`：跨术数历史。
- `/methodology`：方法与版本说明。

首页不再把全部字段堆在一个侧栏中，而是以个人工作台和分步生成流程组织功能。重型图表组件按路由动态加载。

## 6. AI 与流式输出

- 所有生产调用经过专用 AI Gateway `xuanji`。
- 报告 API 真实转发模型增量文本，最终结构化报告写入 D1。
- 聊天 Durable Object 绑定报告 ID，并由服务端读取 Snapshot；浏览器不再把完整命盘上下文塞进每条用户消息。
- 模型失败时保留确定性的 Facts、Claims 和 Evidence，并显示明确的重试入口。

## 7. 隐私与访问控制

- Cloudflare Access 只允许所有者邮箱访问自定义域名和 API。
- Worker 不提供公开个人资料接口。
- 响应默认禁止公共缓存个人数据。
- 分享和导出链接仍位于 Access 保护范围，不生成公开匿名链接。
- 仓库不保存 Access token、DeepSeek key 或 Cloudflare API token。

## 8. 错误处理

- 输入错误返回字段级中文提示。
- 计算错误、模型错误、存储错误和导出错误使用不同错误码。
- Snapshot 写入成功后即视为确定性计算完成；AI 或导出失败不回滚 Snapshot。
- 可安全重试的生成操作使用输入哈希去重。

## 9. 交付标准

- 上述功能均存在真实页面、API、持久化模型和可恢复历史，不以占位页代替。
- 所有命理事实可追溯到确定性引擎和版本化方法。
- Cloudflare Access 邮箱白名单生效。
- D1 迁移、R2/KV/DO binding 与 Worker 部署配置一致。
- 生产构建成功并部署到 `xuanji.chendahuang.com`。
- 项目文档与线上实际能力一致。

用户自行完成产品验收测试；实现阶段仍执行生产构建，因为它是部署的必要条件。
