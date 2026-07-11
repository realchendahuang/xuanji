export type ModelRequest = {
  system: string
  prompt: string
  maxTokens?: number
}

export interface ModelPort {
  generate: (request: ModelRequest) => Promise<string>
}

export function extractModelText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const data = payload as Record<string, unknown>
  if (typeof data.response === 'string') return data.response.trim()
  if (typeof data.result === 'string') return data.result.trim()
  if (data.result && typeof data.result === 'object') {
    const result = data.result as Record<string, unknown>
    if (typeof result.response === 'string') return result.response.trim()
  }
  if (Array.isArray(data.choices)) {
    const first = data.choices[0] as Record<string, unknown> | undefined
    const message = first?.message as Record<string, unknown> | undefined
    if (typeof message?.content === 'string') return message.content.trim()
    if (typeof first?.text === 'string') return first.text.trim()
  }
  return ''
}

type DeepSeekEnv = {
  CF_ACCOUNT_ID: string
  AI_GATEWAY_ID: string
  AI_MODEL: string
  DEEPSEEK_API_KEY: string
}

export class DeepSeekGatewayAdapter implements ModelPort {
  constructor(private env: DeepSeekEnv) {}
  async generate(request: ModelRequest) {
    const response = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/deepseek/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.env.AI_MODEL,
          thinking: { type: 'disabled' },
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.prompt },
          ],
          max_tokens: request.maxTokens ?? 300,
        }),
      },
    )
    if (!response.ok)
      throw new Error(
        `DeepSeek Gateway ${response.status}: ${await response.text()}`,
      )
    return extractModelText(await response.json())
  }
}

export class FakeModelAdapter implements ModelPort {
  constructor(private response = '固定测试解读') {}
  async generate() {
    return this.response
  }
}
