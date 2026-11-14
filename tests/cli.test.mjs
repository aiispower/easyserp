import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function run(args, env = {}) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['src/cli.mjs', ...args], { cwd: new URL('..', import.meta.url), env: { ...process.env, ...env } })
    let stdout = ''; let stderr = ''; child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b)
    child.on('close', code => resolve({ code, stdout, stderr }))
  })
}

test('help is standalone and does not require credentials', async () => {
  const r = await run(['--help'], { EASYSERP_API_KEY: '' })
  assert.equal(r.code, 0); assert.match(r.stdout, /easyserp search QUERY/); assert.equal(r.stderr, '')
})

test('search emits structured JSON and never prints credentials or upstream private errors', async t => {
  const server = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, 'Bearer very-secret')
    let body = ''; for await (const chunk of req) body += chunk
    assert.equal(JSON.parse(body).q, 'cli query')
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ status:'succeeded', search_parameters:{ q:'cli query' }, organic:[{ title:'Example', link:'https://example.test', snippet:'Snippet', position:1 }] }))
  }).listen(0, '127.0.0.1')
  await once(server, 'listening'); t.after(() => server.close())
  const port = server.address().port
  const r = await run(['search', 'cli query'], { EASYSERP_API_KEY:'very-secret', EASYSERP_BASE_URL:`http://127.0.0.1:${port}` })
  assert.equal(r.code, 0); assert.equal(r.stderr, ''); assert.equal(JSON.parse(r.stdout).organic[0].title, 'Example'); assert.doesNotMatch(r.stdout, /very-secret/)
})

test('batch CLI reads JSON file and returns partial result data', async t => {
  const server = createServer(async (req, res) => {
    for await (const _ of req) {}
    res.writeHead(200, { 'content-type':'application/json' }); res.end(JSON.stringify({ status:'succeeded', organic:[] }))
  }).listen(0, '127.0.0.1')
  await once(server, 'listening'); t.after(() => server.close())
  const dir = await mkdtemp(join(tmpdir(), 'easyserp-')); t.after(() => rm(dir, { recursive:true, force:true }))
  const file = join(dir, 'queries.json'); await writeFile(file, JSON.stringify([{ q:'one' }, { q:'two' }]))
  const r = await run(['batch', file, '--concurrency', '1'], { EASYSERP_API_KEY:'key', EASYSERP_BASE_URL:`http://127.0.0.1:${server.address().port}` })
  assert.equal(r.code, 0); const body = JSON.parse(r.stdout); assert.equal(body.summary.succeeded, 2); assert.deepEqual(body.results.map(x => x.index), [0,1])
})
