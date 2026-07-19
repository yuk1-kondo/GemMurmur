import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules', '@litert-lm', 'core', 'wasm')
const dest = resolve(root, 'public', 'wasm')

if (!existsSync(src)) {
  console.error(
    'ERROR: @litert-lm/core の wasm フォルダが見つかりません。`npm install` を実行してください。',
  )
  process.exit(1)
}

// MV3 forbids loading remote scripts. LiteRT-LM defaults to fetching the WASM
// glue from a CDN, which the extension CSP blocks. Bundle it locally instead.
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })

const files = readdirSync(dest)
console.log(`OK: WASM を public/wasm へコピーしました (${files.length} files)`)
