import { Think } from '@cloudflare/think'
import { createWorkersAI } from 'workers-ai-provider'

export class XuanJiAgent extends Think<Env> {
  workspaceBash = false

  getModel() {
    return createWorkersAI({
      binding: this.env.AI,
      gateway: { id: this.env.AI_GATEWAY_ID },
    })(this.env.AI_MODEL)
  }

  getSystemPrompt() {
    return `你是玄机 XuanJi 的命理解读助手。
用户会把已经由确定性计算器生成的四柱、五行、规则依据和报告发给你。
你只解释这些已提供的事实，不重新排盘，不创造未提供的干支、节气或大运数据。
回答使用自然、具体、简洁的中文，先回应问题，再指出你依据的命盘信息。`
  }
}
