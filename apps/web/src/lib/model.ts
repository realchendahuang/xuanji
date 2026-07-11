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

export class WorkersAIGatewayAdapter implements ModelPort {
  constructor(private env: Pick<Env, 'AI' | 'AI_MODEL' | 'AI_GATEWAY_ID'>) {}
  async generate(request: ModelRequest) {
    const result = await this.env.AI.run(
      this.env.AI_MODEL,
      {
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens ?? 300,
      },
      { gateway: { id: this.env.AI_GATEWAY_ID } },
    )
    return extractModelText(result)
  }
}

export class FakeModelAdapter implements ModelPort {
  constructor(private response = '固定测试解读') {}
  async generate() {
    return this.response
  }
}
