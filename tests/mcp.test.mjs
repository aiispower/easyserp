import test from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createServer } from '../src/mcp.mjs'
import { EasySerpError } from '../src/client.mjs'
import { createServer as createHttpServer } from 'node:http'
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

async function session(clientImpl, fn) {
  const server = createServer({ client: clientImpl })
  const client = new Client({ name: 'easyserp-test', version: '1.0.0' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try { await server.connect(a); await client.connect(b); await fn(client) }
  finally { await client.close(); await server.close() }
}

test('MCP initializes, lists tools and calls search through the actual protocol', async () => {
  const calls = []
  await session({ searchRelevant: async args => { calls.push(args); return { status: 'succeeded', organic: [{ title: 'Evidence', link: 'https://example.com', snippet: 'source' }], charged: 1 } } }, async client => {
    const { tools } = await client.listTools()
    assert.deepEqual(tools.map(t => t.name).sort(), ['easyserp_batch_search', 'easyserp_capabilities', 'easyserp_request', 'easyserp_search'])
    assert.equal(tools.find(t => t.name === 'easyserp_search').annotations.readOnlyHint, false)
    const r = await client.callTool({ name: 'easyserp_search', arguments: { q: 'MCP docs', engine: 'bing' } })
    assert.equal(r.structuredContent.organic[0].link, 'https://example.com')
    assert.equal(calls[0].engine, 'bing')
    const bad = await client.callTool({ name: 'easyserp_search', arguments: { q: 'MCP docs', engine: 'unsupported' } })
    assert.equal(bad.isError, true)
    assert.equal(calls.length, 1)
  })
})

test('MCP passes batch options, pending receipts and known request reads', async () => {
  await session({
    batchSearch: async (queries, opts) => ({ results: queries.map((q, index) => ({ index, ok: true, data: { status: 'queued', request_id: 'known-id' } })), concurrency: opts.concurrency }),
    getRequest: async id => ({ request_id: id, status: 'running', charged: 0, settlement_pending: true }),
  }, async client => {
    const batch = await client.callTool({ name: 'easyserp_batch_search', arguments: { queries: [{ q: 'test' }], concurrency: 2 } })
    assert.equal(batch.structuredContent.concurrency, 2)
    const pending = await client.callTool({ name: 'easyserp_request', arguments: { request_id: 'known-id' } })
    assert.equal(pending.structuredContent.status, 'running')
    assert.equal(pending.isError, undefined)
    assert.equal(pending.structuredContent.settlement_pending, true)
  })
})

test('MCP returns recovery keys for uncertain outcomes without error message secrets', async () => {
  await session({ searchRelevant: async () => { throw new EasySerpError('transport_unknown', { idempotencyKey: 'stable-key-1234' }) } }, async client => {
    const r = await client.callTool({ name: 'easyserp_search', arguments: { q: 'test' } })
    assert.equal(r.isError, true)
    assert.equal(r.structuredContent.error.idempotency_key, 'stable-key-1234')
    assert.equal(r.structuredContent.error.code, 'transport_unknown')
  })
})

test('MCP stdio works without credentials for onboarding and emits only protocol output', async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: [new URL('../src/mcp.mjs', import.meta.url).pathname], env: { PATH: process.env.PATH ?? '' }, stderr: 'pipe' })
  const client = new Client({ name: 'stdio-smoke', version: '1.0.0' })
  try {
    await client.connect(transport)
    const r = await client.callTool({ name: 'easyserp_capabilities', arguments: {} })
    assert.equal(r.structuredContent.capacity_qps, 2000)
    assert.equal(r.structuredContent.pricing.price_per_1000_searches, 2)
    assert.equal(r.structuredContent.pricing.gift_frequency, 'once')
    const noKey = await client.callTool({ name: 'easyserp_search', arguments: { q: 'test' } })
    assert.equal(noKey.isError, true)
  } finally { await client.close() }
})

test('MCP stdio reads a private key file and sends valid Google pagination to HTTP API', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'easyserp-mcp-'))
  const keyFile = path.join(dir, 'api.key')
  await writeFile(keyFile, 'test-only-api-key\n', { mode: 0o600 })
  let received
  const http = createHttpServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk
    received = { auth: req.headers.authorization, params: JSON.parse(body) }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ request_id: 'known-request', status: 'succeeded', organic: [{ title: 'Evidence', link: 'https://example.com', snippet: 'test' }], charged: 1 }))
  })
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
  const transport = new StdioClientTransport({ command: process.execPath, args: [new URL('../src/mcp.mjs', import.meta.url).pathname], env: { PATH: process.env.PATH ?? '', EASYSERP_API_KEY_FILE: keyFile, EASYSERP_BASE_URL: `http://127.0.0.1:${http.address().port}` }, stderr: 'pipe' })
  const client = new Client({ name: 'key-file-smoke', version: '1.0.0' })
  try {
    await client.connect(transport)
    const r = await client.callTool({ name: 'easyserp_search', arguments: { q: 'test', engine: 'google', count: 10, start: 0, cursor: '0' } })
    assert.equal(r.isError, undefined)
    assert.equal(r.structuredContent.status, 'succeeded')
    assert.equal(received.auth, 'Bearer test-only-api-key')
    assert.equal(received.params.cursor, '0')
    assert.doesNotMatch(JSON.stringify(r), /test-only-api-key/)
  } finally {
    await client.close()
    await new Promise(resolve => http.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})

test('MCP starts through a symlinked npm bin or macOS temporary path', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'easyserp-symlink-'))
  const entry = path.join(dir, 'easyserp-mcp.mjs')
  await symlink(new URL('../src/mcp.mjs', import.meta.url).pathname, entry)
  const client = new Client({ name: 'symlink-test', version: '1.0.0' })
  try {
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], env: { PATH: process.env.PATH ?? '' }, stderr: 'pipe' }))
    const r = await client.callTool({ name: 'easyserp_capabilities', arguments: {} })
    assert.equal(r.structuredContent.product, 'easyserp')
  } finally { await client.close(); await rm(dir, { recursive: true, force: true }) }
})
