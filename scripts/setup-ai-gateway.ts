async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const gatewayId = process.env.AI_GATEWAY_ID ?? 'xuanji'
  if (!accountId || !apiToken) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first')
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways`
  const headers = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
  const existing = await fetch(`${endpoint}/${gatewayId}`, { headers })
  if (existing.ok) return console.log(`AI Gateway ${gatewayId} already exists`)
  const created = await fetch(endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({ id: gatewayId, cache_invalidate_on_update: true, collect_logs: true }),
  })
  if (!created.ok) throw new Error(`Gateway creation failed: ${await created.text()}`)
  console.log(`Created AI Gateway ${gatewayId}`)
}

void main()
