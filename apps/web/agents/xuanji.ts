import { Think } from '@cloudflare/think'
import { createOpenAI } from '@ai-sdk/openai'
import { tool } from 'ai'
import type { ToolSet } from 'ai'
import { z } from 'zod'
import { getProfile, getReading, getSnapshot } from '../src/lib/db'
import { evaluateSnapshot } from '../src/lib/rules'

export class XuanJiAgent extends Think<Env> {
  workspaceBash = false

  getModel() {
    const env = this.env as Env & { DEEPSEEK_API_KEY: string }
    return createOpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/deepseek`,
    }).chat(env.AI_MODEL)
  }

  getTools(): ToolSet {
    const idSchema = z.object({ id: z.string().uuid() })
    return {
      getBirthProfile: tool({
        description: '按 ID 读取已保存的出生资料。',
        inputSchema: idSchema,
        execute: async ({ id }) => getProfile(this.env.DB, id),
      }),
      getChartSnapshot: tool({
        description: '按 ID 读取不可变八字命盘 Snapshot。',
        inputSchema: idSchema,
        execute: async ({ id }) => getSnapshot(this.env.DB, id),
      }),
      evaluateRules: tool({
        description:
          '对已存在的命盘 Snapshot 运行版本化规则并返回 Evidence 与 Claims。',
        inputSchema: z.object({ snapshotId: z.string().uuid() }),
        execute: async ({ snapshotId }) => {
          const snapshot = await getSnapshot(this.env.DB, snapshotId)
          return snapshot
            ? evaluateSnapshot(snapshot)
            : { error: 'CHART_NOT_FOUND' }
        },
      }),
      getReading: tool({
        description: '按 ID 读取已生成的结构化报告。',
        inputSchema: idSchema,
        execute: async ({ id }) => getReading(this.env.DB, id),
      }),
      generateReading: tool({
        description:
          '基于已存在的 Snapshot 生成可供回答使用的 Claims 和 Evidence，不重新排盘。',
        inputSchema: z.object({ snapshotId: z.string().uuid() }),
        execute: async ({ snapshotId }) => {
          const snapshot = await getSnapshot(this.env.DB, snapshotId)
          if (!snapshot) return { error: 'CHART_NOT_FOUND' }
          const evaluated = evaluateSnapshot(snapshot)
          return {
            snapshotId,
            facts: snapshot.facts,
            claims: evaluated.sections,
            evidence: evaluated.evidence,
          }
        },
      }),
    }
  }

  getSystemPrompt() {
    return `你是玄机 XuanJi 的命理解读助手。
用户会把已经由确定性计算器生成的四柱、五行、规则依据和报告发给你。
你只解释这些已提供的事实，不重新排盘，不创造未提供的干支、节气或大运数据。
回答使用自然、具体、简洁的中文，先回应问题，再指出你依据的命盘信息。`
  }
}
