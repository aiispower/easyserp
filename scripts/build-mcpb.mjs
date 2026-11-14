#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const reportDir = join(root, '.local/distribution-20261114/mcpb')
const stage = join(reportDir, 'staging')
const artifact = join(root, 'dist/easyserp-1.0.0.mcpb')
const releaseUrl = 'https://github.com/aiispower/easyserp/releases/download/v1.0.0/easyserp-1.0.0.mcpb'
const copyFile = async (from, to) => { await mkdir(dirname(to), { recursive: true }); await cp(from, to, { recursive: true }) }
const excluded = relative => {
  const segments = relative.split(/[\\/]/)
  const leaf = segments.at(-1)
  return segments.some(part => ['.git', '.cache', '.bin', 'node_modules', 'tests', 'test', '__tests__', 'benchmarks', 'docs', 'examples', '.github'].includes(part)) ||
    ['.package-lock.json', '.npmrc'].includes(leaf) || leaf.startsWith('.env') || /\.(?:ts|tsx|map|md|mdx)$/.test(leaf)
}
const copyRuntimePackage = async (from, to) => {
  await mkdir(dirname(to), { recursive: true })
  await cp(from, to, { recursive: true, filter: source => !excluded(source.slice(from.length).replace(/^[/\\]/, '')) })
}
const installedPackage = async (fromDirectory, name) => {
  const segments = name.split('/')
  const nodeModulesRoot = join(root, 'node_modules')
  let current = fromDirectory
  for (;;) {
    const candidate = current === nodeModulesRoot ? join(current, ...segments) : join(current, 'node_modules', ...segments)
    try { await stat(join(candidate, 'package.json')); return candidate } catch { /* try the parent node_modules */ }
    if (current === nodeModulesRoot) return null
    const parent = dirname(current)
    if (parent === current || !parent.startsWith(nodeModulesRoot)) return null
    current = parent
  }
}
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}: ${(result.stderr || result.stdout || '').trim()}`)
  return result.stdout.trim()
}

await rm(stage, { recursive: true, force: true })
await rm(join(reportDir, 'offline-unpacked'), { recursive: true, force: true })
await mkdir(stage, { recursive: true })
await mkdir(join(root, 'dist'), { recursive: true })
await mkdir(reportDir, { recursive: true })
for (const file of ['manifest.json', 'README.md', 'LICENSE']) await copyFile(join(root, file), join(stage, file))
for (const file of ['client.mjs', 'format.mjs', 'mcp.mjs']) await copyFile(join(root, 'src', file), join(stage, 'src', file))
await copyFile(join(root, 'assets/easyserp-icon.png'), join(stage, 'assets/easyserp-icon.png'))

// Copy the complete production dependency closure for the MCP SDK and its Zod peer,
// preserving package placement while excluding nested trees, caches, and credential files.
const packages = new Map()
const queue = ['@modelcontextprotocol/sdk', 'zod'].map(name => ({ name, location: join(root, 'node_modules', ...name.split('/')) }))
while (queue.length) {
  const item = queue.shift()
  const location = await realpath(item.location)
  if (packages.has(location)) continue
  const metadata = JSON.parse(await readFile(join(location, 'package.json'), 'utf8'))
  packages.set(location, { name: metadata.name, version: metadata.version, relativePath: location.slice(join(root, 'node_modules').length + 1).split(/[\\/]/).join('/') })
  const optionalPeers = new Set(Object.entries(metadata.peerDependenciesMeta ?? {}).filter(([, value]) => value.optional).map(([name]) => name))
  const dependencyNames = new Set([
    ...Object.keys(metadata.dependencies ?? {}),
    ...Object.keys(metadata.optionalDependencies ?? {}),
    ...Object.keys(metadata.peerDependencies ?? {}).filter(name => !optionalPeers.has(name)),
  ])
  for (const dependencyName of dependencyNames) {
    const dependencyPath = await installedPackage(location, dependencyName)
    if (dependencyPath) queue.push({ name: dependencyName, location: dependencyPath })
    else if (!optionalPeers.has(dependencyName) && !Object.hasOwn(metadata.optionalDependencies ?? {}, dependencyName)) throw new Error(`Missing runtime dependency ${dependencyName} required by ${metadata.name}@${metadata.version}`)
  }
}
for (const [location, metadata] of packages) await copyRuntimePackage(location, join(stage, 'node_modules', ...metadata.relativePath.split('/')))

const toolVersion = run('npx', ['--yes', '@anthropic-ai/mcpb', '--version'])
const packageOutput = run('npx', ['--yes', '@anthropic-ai/mcpb', 'pack', stage, artifact])
const artifactBytes = await readFile(artifact)
const sha256 = createHash('sha256').update(artifactBytes).digest('hex')

const server = {
  $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
  name: 'io.github.aiispower/easyserp',
  title: 'easyserp',
  description: 'Search Google and Bing through MCP with source-domain filters and safe request recovery.',
  version: '1.0.0',
  websiteUrl: 'https://serp.skyvora.cc',
  repository: { source: 'github', url: 'https://github.com/aiispower/easyserp' },
  packages: [{ registryType: 'mcpb', identifier: releaseUrl, fileSha256: sha256, transport: { type: 'stdio' } }],
}
await writeFile(join(root, 'server.json'), `${JSON.stringify(server, null, 2)}\n`)

// Verify the packed archive itself can start outside the project tree, using only its contents.
const extracted = await mkdtemp(join(tmpdir(), 'easyserp-mcpb-offline-'))
run('unzip', ['-q', artifact, '-d', extracted])
const protocolInput = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'mcpb-offline-check', version: '1.0.0' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'easyserp_capabilities', arguments: {} } },
].map(message => JSON.stringify(message)).join('\n') + '\n'
const protocol = spawnSync('node', ['src/mcp.mjs'], { cwd: extracted, encoding: 'utf8', input: protocolInput, timeout: 15000, env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' } })
if (protocol.error || protocol.status !== 0) throw new Error(`Offline MCP protocol check failed: ${(protocol.stderr || protocol.error?.message || '').trim()}`)
const responses = protocol.stdout.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
const initialized = responses.find(message => message.id === 1)
const listed = responses.find(message => message.id === 2)
const capabilities = responses.find(message => message.id === 3)
if (!initialized?.result?.serverInfo || !listed?.result?.tools?.some(tool => tool.name === 'easyserp_search')) throw new Error('Packed server did not initialize or list the expected search tool.')
if (!capabilities?.result?.structuredContent?.engines?.includes('google')) throw new Error('Packed capabilities tool failed without an API key.')
await rm(extracted, { recursive: true, force: true })

const inventory = []
const walk = async directory => {
  const { readdir } = await import('node:fs/promises')
  for (const name of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, name.name)
    if (name.isDirectory()) await walk(path)
    else inventory.push({ path: path.slice(stage.length + 1).split('/').join('/'), bytes: (await stat(path)).size })
  }
}
await walk(stage)
await writeFile(join(reportDir, 'build-report.json'), `${JSON.stringify({ date: '2026-11-14', version: '1.0.0', mcpb_cli_version: toolVersion, runtime_dependencies: [...packages.values()].sort((a, b) => a.name.localeCompare(b.name)), artifact: 'dist/easyserp-1.0.0.mcpb', artifact_bytes: artifactBytes.length, sha256, release_url_status: 'planned_not_uploaded', registry_metadata: 'server.json prepared, not submitted', pack_output: packageOutput, offline_protocol: { initialized: true, tools_listed: true, capabilities_without_api_key: true, cwd_outside_repository: true, node_path_unset: true }, files: inventory }, null, 2)}\n`)
await writeFile(join(reportDir, 'offline-protocol-report.json'), `${JSON.stringify({ initialize: initialized.result, tool_names: listed.result.tools.map(tool => tool.name), capabilities: capabilities.result.structuredContent }, null, 2)}\n`)
await writeFile(join(reportDir, 'file-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`)
process.stdout.write(`${JSON.stringify({ artifact, artifact_bytes: artifactBytes.length, sha256, mcpb_cli_version: toolVersion, release_url_status: 'planned_not_uploaded', server_json: join(root, 'server.json'), report: join(reportDir, 'build-report.json') }, null, 2)}\n`)
