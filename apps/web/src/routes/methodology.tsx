import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/methodology')({
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <div className="content-page methodology-page">
      <header>
        <span className="section-number">方法</span>
        <h1>计算与解释分开</h1>
        <p>
          玄机先生成可重复的命盘事实，再由规则和 AI 解释，不让模型代替历法计算。
        </p>
      </header>
      <section>
        <h2>当前八字口径</h2>
        <dl>
          <div>
            <dt>换年</dt>
            <dd>立春</dd>
          </div>
          <div>
            <dt>换日</dt>
            <dd>00:00</dd>
          </div>
          <div>
            <dt>时间</dt>
            <dd>当地民用时间</dd>
          </div>
          <div>
            <dt>计算引擎</dt>
            <dd>tyme4ts 1.5.2</dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>报告证据</h2>
        <p>
          每条主要判断都引用日主、四柱或五行分布。追问继续使用同一个
          Snapshot，不重新排盘。
        </p>
      </section>
      <section>
        <h2>AI 路径</h2>
        <p>
          所有模型请求通过项目专属 Cloudflare AI Gateway <code>xuanji</code>
          ，当前默认模型为 GLM-4.7-Flash。
        </p>
      </section>
    </div>
  )
}
