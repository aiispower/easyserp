import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const skill = path.join(root, 'skills/easyserp')
await mkdir(path.join(skill, 'scripts'), { recursive: true })
for (const file of ['client.mjs', 'cli.mjs', 'format.mjs']) {
  await copyFile(path.join(root, 'src', file), path.join(skill, 'scripts', file))
}
await copyFile(path.join(root, 'LICENSE'), path.join(skill, 'LICENSE'))
await mkdir(path.join(skill, 'assets'), { recursive: true })
for (const file of ['easyserp-icon.png', 'easy-search-family-banner.png']) {
  await copyFile(path.join(root, 'assets', file), path.join(skill, 'assets', file))
}
const readme = (await readFile(path.join(root, 'README.md'), 'utf8'))
  .replaceAll('](assets/', '](https://raw.githubusercontent.com/aiispower/easyserp/main/assets/')
  .replaceAll('](docs/', '](https://github.com/aiispower/easyserp/blob/main/docs/')
  .replaceAll('node src/cli.mjs', 'node scripts/cli.mjs')
await writeFile(path.join(skill, 'README.md'), readme)
// The minimal portable Skill needs no npm install or dependencies.
await writeFile(path.join(skill, 'package.json'), JSON.stringify({ name: 'easyserp-skill', version: '1.0.0', private: true, type: 'module', engines: { node: '>=20' }, license: 'MIT' }, null, 2) + '\n')
const skillText = await readFile(path.join(skill, 'SKILL.md'), 'utf8')
if (!/^name: easyserp$/m.test(skillText)) throw new Error('Skill identity is inconsistent')
process.stderr.write('Prepared portable easyserp Skill.\n')
