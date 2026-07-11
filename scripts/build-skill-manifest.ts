import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

async function main() {
  const content = await readFile(new URL('../skills/bazi-core/SKILL.md', import.meta.url), 'utf8')
  const manifest = {
    generatedAt: new Date().toISOString(),
    skills: [{ id: 'bazi-core', version: '1.0.0', path: 'bazi-core/SKILL.md', sha256: createHash('sha256').update(content).digest('hex') }],
  }
  await writeFile(new URL('../skills/manifest.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log('Wrote skills/manifest.json')
}

void main()
