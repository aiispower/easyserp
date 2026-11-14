import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { EasySerpClient } from '../src/client.mjs'

const allCases = [
  { engine: 'google', q: 'site:serper.dev Google Search API pricing', region: 'US', gl: 'US', hl: 'en', expected_domain: 'serper.dev' },
  { engine: 'bing', q: 'site:tikhub.io MCP social media API', region: 'US', cc: 'US', gl: 'US', hl: 'en', mkt: 'en-US', expected_domain: 'tikhub.io' },
  { engine: 'google', q: 'site:qian-gua.com 笔记搜索', region: 'CN', gl: 'CN', hl: 'zh', expected_domain: 'qian-gua.com' },
  { engine: 'bing', q: 'site:newrank.cn 新榜 数据 API', region: 'CN', cc: 'CN', gl: 'CN', hl: 'zh', mkt: 'zh-CN', expected_domain: 'newrank.cn' },
]
const args = process.argv.slice(2)
const chosen = args.length === 2 && args[0] === '--case' ? Number(args[1]) : undefined
if (args.length && (!Number.isInteger(chosen) || chosen < 0 || chosen >= allCases.length)) throw new Error('Usage: node scripts/check-quality.mjs [--case 0..3]')
const cases = chosen === undefined ? allCases : [allCases[chosen]]
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const queries = cases.map(({ expected_domain, ...params }) => ({ ...params, idempotency_key: randomUUID() }))
await mkdir('.local', { recursive: true })
await writeFile(`.local/quality-${runId}-intents.json`, JSON.stringify({ timestamp: new Date().toISOString(), cases, queries }, null, 2), { mode: 0o600 })
const started = performance.now()
const batch = await new EasySerpClient().batchSearch(queries, { concurrency: 2 })
const results = batch.results.map((r, index) => {
  const items = r.data?.organic ?? []
  const domain = cases[index].expected_domain
  const matched = items.filter(item => {
    try { const host = new URL(item.link).hostname; return host === domain || host.endsWith('.' + domain) } catch { return false }
  })
  return { ...r, q: cases[index].q, engine: cases[index].engine, expected_domain: domain, expected_domain_matches: matched.length, source_scope_check: !r.ok || ['queued', 'running'].includes(r.data?.status) ? 'unknown' : matched.length === items.length && matched.length > 0 ? 'passed' : 'review_required' }
})
const report = { timestamp: new Date().toISOString(), client_wall_ms: Math.round(performance.now() - started), concurrency: 2, summary: batch.summary, results }
await writeFile(`.local/quality-${runId}.json`, JSON.stringify(report, null, 2), { mode: 0o600 })
process.stdout.write(JSON.stringify({ ...report, results: results.map(({ data, error, ...r }) => ({ ...r, status: data?.status, result_count: data?.organic?.length, client_duration_ms: data?.client_duration_ms, error_code: error?.code })) }, null, 2) + '\n')
if (results.some(r => r.source_scope_check !== 'passed')) process.exitCode = 1
