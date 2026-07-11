import startHandler from '@tanstack/react-start/server-entry'
import type { ThinkAppContext } from '@cloudflare/think/server-entry'
import { apiApp } from './server/api'

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    _think?: ThinkAppContext,
  ) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/agents/')) return null
    if (url.pathname.startsWith('/api/v1/')) {
      return apiApp.fetch(request, env, ctx)
    }
    if (url.pathname === '/health') {
      return apiApp.fetch(
        new Request(new URL('/api/v1/health', request.url), request),
        env,
        ctx,
      )
    }
    return startHandler.fetch(request)
  },
}
