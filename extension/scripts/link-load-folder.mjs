import { existsSync, lstatSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const link = resolve(root, 'chrome-extension')

if (!existsSync(resolve(dist, 'manifest.json'))) {
  console.error('ERROR: dist/manifest.json がありません。先に vite build を実行してください。')
  process.exit(1)
}

function removeIfExists(path) {
  if (!existsSync(path)) return
  const stat = lstatSync(path)
  if (stat.isSymbolicLink() || stat.isDirectory()) {
    rmSync(path, { recursive: true, force: true })
  } else {
    rmSync(path)
  }
}

removeIfExists(link)
symlinkSync('dist', link, 'dir')
console.log('OK: chrome-extension -> dist（旧フォルダ名の互換リンク）')
