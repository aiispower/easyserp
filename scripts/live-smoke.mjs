// Bounded live validation: exactly two POSTs by default, no polling or retries.
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { EasySerpClient } from '../src/client.mjs'

const queries = [
  { engine: 'google', q: 'Model Context Protocol official documentation', region: 'US', idempotency_key: randomUUID() },
  { engine: 'bing', q: 'Google Search Central structured data documentation', region: 'US', idempotency_key: randomUUID() },
]
await mkdir('.local', { recursive: true })
// Store recoverable identities before sending any potentially billable request.
await writeFile('.local/live-smoke-intents.json', JSON.stringify({ timestamp: new Date().toISOString(), queries }, null, 2), { mode: 0o600 })
const started = performance.now()
const result = await new EasySerpClient().batchSearch(queries, { concurrency: 2 })
const report = { timestamp: new Date().toISOString(), client_wall_ms: Math.round(performance.now() - started), summary: result.summary, results: result.results }
await writeFile('.local/live-smoke.json', JSON.stringify(report, null, 2), { mode: 0o600 })
process.stdout.write(JSON.stringify({ summary: report.summary, client_wall_ms: report.client_wall_ms, results: result.results.map((r, index) => ({ engine: queries[index].engine, ok: r.ok, status: r.data?.status, result_count: r.data?.organic?.length, charged: r.data?.charged, client_duration_ms: r.data?.client_duration_ms, error_code: r.error?.code })), report: '.local/live-smoke.json' }, null, 2) + '\n')
if (result.summary.succeeded !== queries.length) process.exitCode = 1
