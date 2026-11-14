import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const root = fileURLToPath(new URL('../', import.meta.url))
await mkdir(path.join(root, '.local'), { recursive: true })
await mkdir(path.join(root, 'dist'), { recursive: true })
const [packed] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', 'dist', '--json'], { cwd: root, encoding: 'utf8' }))
for (const f of packed.files) assert(!/(^|\/)(\.local|\.private|node_modules)(\/|$)/.test(f.path), 'Private material in public package')
const dir = await mkdtemp(path.join(tmpdir(), 'easyserp-installed-'))
const client = new Client({ name: 'easyserp-release-check', version: '1.0.0' })
try {
  execFileSync('npm', ['install', ...(process.argv.includes('--offline') ? ['--offline'] : []), '--ignore-scripts', '--no-audit', '--no-fund', '--prefix', dir, path.join(root, 'dist', packed.filename)], { encoding: 'utf8', stdio: 'pipe' })
  const cli = path.join(dir, 'node_modules/.bin/easyserp')
  const mcp = path.join(dir, 'node_modules/.bin/easyserp-mcp')
  assert.match(execFileSync(cli, ['--help'], { encoding: 'utf8' }), /easyserp/i)
  await client.connect(new StdioClientTransport({ command: mcp, args: [], env: { PATH: process.env.PATH ?? '' }, stderr: 'pipe' }))
  const result = await client.callTool({ name: 'easyserp_capabilities', arguments: {} })
  assert.equal(result.structuredContent.product, 'easyserp')
  assert.equal(result.structuredContent.capacity_qps, 2000)
  assert.equal(result.structuredContent.pricing.price_per_1000_searches, 2)
  await writeFile(path.join(root, '.local/release-verification.json'), JSON.stringify({ timestamp: new Date().toISOString(), artifact: packed.filename, npm_tarball_install: 'passed', installed_cli: 'passed', installed_mcp_protocol: 'passed', private_material_check: 'passed' }, null, 2), { mode: 0o600 })
  const manifestPath = path.join(root, 'dist/manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const archive = await readFile(path.join(root, 'dist', packed.filename))
  manifest.artifacts = manifest.artifacts.filter(a => a.artifact !== packed.filename)
  manifest.artifacts.push({ artifact: packed.filename, sha256: createHash('sha256').update(archive).digest('hex'), bytes: archive.length, status: 'prepared_not_submitted', license: 'MIT', verification: 'installed_cli_and_mcp_passed' })
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  process.stdout.write('npm tarball install, installed CLI/MCP and public-file audit passed.\n')
} finally {
  await client.close()
  await rm(dir, { recursive: true, force: true })
}
