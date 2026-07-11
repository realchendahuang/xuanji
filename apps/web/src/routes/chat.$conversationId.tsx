import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/chat/$conversationId')({
  component: ChatRoute,
})

function ChatRoute() {
  const { conversationId } = Route.useParams()
  return (
    <main className="standalone-page">
      <span className="section-number">对话</span>
      <h1>继续原对话</h1>
      <p>
        对话由 Durable Object 按 ID <code>{conversationId}</code>{' '}
        保存。请从对应报告页进入，以同时加载命盘事实和 Evidence。
      </p>
      <Link to="/history">返回历史报告</Link>
    </main>
  )
}
