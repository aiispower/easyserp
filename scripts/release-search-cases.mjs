import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { EasySerpClient } from '../src/client.mjs'

// Public topics, explicit expected scope; no upstream service administration.
const cases = [
  { id: 'google-brand', q: 'OpenAI', engine: 'google', region: 'US', include: ['openai.com'] },
  { id: 'bing-code', q: 'LangGraph', engine: 'bing', region: 'US', include: ['langchain.com', 'github.com', 'langchain-ai.github.io'] },
  { id: 'google-zh', q: '人工智能', engine: 'google', region: 'US', hl: 'zh' },
  { id: 'bing-zh', q: '人工智能', engine: 'bing', region: 'CN', hl: 'zh', mkt: 'zh-CN' },
  { id: 'google-product', q: 'Serper', engine: 'google', region: 'US', include: ['serper.dev'] },
  { id: 'bing-product', q: 'TikHub', engine: 'bing', region: 'US', include: ['tikhub.io'] },
  { id: 'google-docs', q: 'Node.js fetch', engine: 'google', region: 'US', include: ['nodejs.org', 'developer.mozilla.org'] },
  { id: 'bing-docs', q: 'Python asyncio', engine: 'bing', region: 'US', include: ['python.org'] },
  { id: 'google-pt-br', q: 'energia solar', engine: 'google', region: 'BR', hl: 'pt', gl: 'BR' },
  { id: 'bing-creator', q: '自媒体 选题', engine: 'bing', region: 'CN', hl: 'zh', mkt: 'zh-CN' },
  { id: 'google-strict-scope', q: 'site:serper.dev Google Search API pricing', engine: 'google', region: 'US', include: ['serper.dev'] },
  { id: 'bing-empty-scope', q: 'site:no-such-easyserp-example.invalid hello', engine: 'bing', region: 'US', include: ['no-such-easyserp-example.invalid'], expectedEmpty: true },
]
const client = new EasySerpClient()
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const out = `.local/search-validation-${runId}`
await mkdir(out, { recursive: true, mode: 0o700 })
const intents = cases.map(({ id, include, expectedEmpty, ...params }) => ({ id, include, expectedEmpty, params: { ...params, idempotency_key: randomUUID() } }))
await writeFile(`${out}/intents.json`, JSON.stringify(intents, null, 2), { mode: 0o600 })
const results = new Array(cases.length)
let cursor = 0
const started = performance.now()
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < intents.length) {
    const index = cursor++
    const item = intents[index]
    let row
    const begin = performance.now()
    try {
      const data = await client.searchRelevant(item.params, { retries: 2, deadlineMs: 65000, includeDomains: item.include ?? [] })
      const organic = data.organic ?? []
      const scoped = organic.every(r => { try { const u = new URL(r.link); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && (!item.include?.length || item.include.some(d => u.hostname === d || u.hostname.endsWith('.' + d))) } catch { return false } })
      const scopeHonest = !item.include?.length || organic.length > 0 || data.quality?.warnings?.includes('source_scope_not_satisfied')
      row = { id: item.id, q: item.params.q, engine: item.params.engine, status: data.status, useful_results: organic.length, original_results: data.original_organic?.length ?? 0, attempts: data.attempt_history?.length ?? 1, charged_total: data.charged_total, charged_total_known: data.charged_total_known, scope_check: scoped && scopeHonest ? 'passed' : 'failed', expected_empty: item.expectedEmpty ?? false, data }
    } catch (error) {
      row = { id: item.id, q: item.params.q, engine: item.params.engine, status: 'unavailable', useful_results: 0, scope_check: 'not_applicable', error: error.toJSON?.() ?? { code: 'client_error' } }
    }
    row.client_wall_ms = Math.round(performance.now() - begin)
    results[index] = row
    await writeFile(`${out}/${item.id}.json`, JSON.stringify(row, null, 2), { mode: 0o600 })
    const { data, error, ...summary } = row
    process.stdout.write(JSON.stringify({ ...summary, error_code: error?.code, recovery_attempts: error?.attempt_history?.length }) + '\n')
  }
}))
const summary = { total: results.length, with_results: results.filter(r => r.useful_results > 0).length, unavailable: results.filter(r => r.status === 'unavailable').length, pending: results.filter(r => ['queued', 'running'].includes(r.status)).length, scope_violations: results.filter(r => r.scope_check === 'failed').length, google_with_results: results.filter(r => r.engine === 'google' && r.useful_results > 0).length, bing_with_results: results.filter(r => r.engine === 'bing' && r.useful_results > 0).length, wall_ms: Math.round(performance.now() - started), output: out }
await writeFile(`${out}/report.json`, JSON.stringify({ timestamp: new Date().toISOString(), summary, results }, null, 2), { mode: 0o600 })
await writeFile('.local/latest-search-validation.json', JSON.stringify({ ...summary, report: `${out}/report.json` }, null, 2), { mode: 0o600 })
process.stdout.write(JSON.stringify({ type: 'done', ...summary }) + '\n')
if (summary.scope_violations || !summary.google_with_results || !summary.bing_with_results) process.exitCode = 1
