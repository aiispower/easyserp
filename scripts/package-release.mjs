import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
execFileSync(process.execPath, [path.join(root, 'scripts/prepare-skill.mjs')], { stdio: 'inherit' })
const code = String.raw`
import pathlib,zipfile,hashlib,json
root=pathlib.Path.cwd();skill=root/'skills/easyserp';dist=root/'dist';dist.mkdir(exist_ok=True)
license0='''MIT No Attribution\n\nCopyright (c) 2026 easyserp contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n'''
rows=[]
for platform in ['skillhub','clawhub']:
 out=dist/f'easyserp-1.0.0-{platform}.zip'
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(skill.rglob('*')):
   if not p.is_file():continue
   rel=p.relative_to(skill).as_posix()
   if p.is_symlink() or rel.startswith('.') or any(a in rel.split('/') for a in ['node_modules','.local','.private','__pycache__']):raise RuntimeError('Unexpected private artifact in Skill')
   data=p.read_bytes()
   if platform=='clawhub' and rel=='LICENSE':data=license0.encode()
   if rel=='package.json' and platform=='clawhub':
    d=json.loads(data);d['license']='MIT-0';data=(json.dumps(d,indent=2)+'\n').encode()
   info=zipfile.ZipInfo(rel,(2026,11,14,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
   z.writestr(info,data)
 rows.append({'artifact':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,'status':'prepared_not_submitted','license':'MIT-0' if platform=='clawhub' else 'MIT'})
out=dist/'easyserp-1.0.0-claude-plugin.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for base in [root/'.claude-plugin',root/'skills/easyserp']:
  for p in sorted(base.rglob('*')):
   if p.is_file() and not p.is_symlink():z.write(p,p.relative_to(root).as_posix())
 z.write(root/'LICENSE','LICENSE')
rows.append({'artifact':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,'status':'prepared_not_submitted','license':'MIT','format':'claude-plugin'})
(dist/'manifest.json').write_text(json.dumps({'product':'easyserp','version':'1.0.0','artifacts':rows},indent=2)+'\n')
print(json.dumps(rows,indent=2))
`
execFileSync('python3', ['-c', code], { cwd: root, stdio: 'inherit' })
