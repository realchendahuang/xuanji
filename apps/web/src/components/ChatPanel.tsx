import { useState } from 'react'
import { Send } from 'lucide-react'
import { useAgent } from 'agents/react'
import { useAgentChat } from '@cloudflare/think/react'
import type { ChartSnapshot, Reading } from '../lib/types'

type ChatMessage = {
  id: string
  role: string
  parts: Array<{ type: string; text?: string }>
}

function visibleUserText(text: string) {
  const marker = '\n【问题】'
  return text.includes(marker) ? (text.split(marker).at(-1) ?? text) : text
}

export function ChatPanel({
  reading,
  snapshot,
}: {
  reading: Reading
  snapshot: ChartSnapshot
}) {
  const [input, setInput] = useState('')
  const agent = useAgent({ agent: 'xuanji', name: reading.id })
  const { messages, sendMessage, status, isRecovering } = useAgentChat({
    agent,
  })
  const busy = status === 'submitted' || status === 'streaming' || isRecovering

  return (
    <section className="chat-panel" aria-label="继续追问">
      <div className="section-heading-row">
        <div>
          <span className="section-number">04</span>
          <h2>继续追问</h2>
        </div>
        <span className="agent-state">
          {isRecovering ? '恢复中' : busy ? '思考中' : '在线'}
        </span>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">
            可以继续问：为什么这样判断？我最近适合把注意力放在哪里？
          </p>
        ) : (
          (messages as ChatMessage[]).map((message) => (
            <div className={`chat-message ${message.role}`} key={message.id}>
              <span>{message.role === 'user' ? '你' : '玄机'}</span>
              <div>
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <p key={`${message.id}-${index}`}>
                      {message.role === 'user'
                        ? visibleUserText(part.text ?? '')
                        : part.text}
                    </p>
                  ) : null,
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault()
          const question = input.trim()
          if (!question || busy) return
          const context = JSON.stringify({
            facts: snapshot.facts,
            reading: { summary: reading.summary, evidence: reading.evidence },
          })
          sendMessage({ text: `【命盘上下文】${context}\n【问题】${question}` })
          setInput('')
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="继续追问…"
          aria-label="继续追问"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="发送"
        >
          <Send size={17} strokeWidth={1.8} />
        </button>
      </form>
    </section>
  )
}
