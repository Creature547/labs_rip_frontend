import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

async function filesAt(directory) {
  const result = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name)
    if (item.isDirectory()) result.push(...await filesAt(path))
    else if (!item.name.startsWith('.') && item.name !== 'sw.js' && !item.name.endsWith('.mp4')) result.push(path)
  }
  return result
}

const files = (await filesAt('dist')).sort()
const hash = createHash('sha256')
for (const file of files) hash.update(file).update(await readFile(file))
const template = await readFile('scripts/worker-template.js', 'utf8')
await writeFile('dist/sw.js', template
  .replace('__VERSION__', hash.digest('hex').slice(0, 16))
  .replace('/* FILES */ []', JSON.stringify(files.map(file => './' + relative('dist', file).split('\\').join('/')))))
