import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist')
const manifestPath = resolve(outDir, 'manifest.json')

if (!existsSync(manifestPath)) {
  console.error('ERROR: dist/manifest.json が見つかりません。先に npm run build を実行してください。')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const missing = []

if (manifest.version !== pkg.version) {
  console.error(
    `ERROR: manifest version (${manifest.version}) != package.json (${pkg.version}). Rebuild after bumping extension/package.json`,
  )
  process.exit(1)
}

function check(rel) {
  const path = resolve(outDir, rel)
  if (!existsSync(path)) missing.push(rel)
}

check(manifest.background.service_worker)
check(manifest.action.default_popup)
for (const cs of manifest.content_scripts ?? []) {
  for (const js of cs.js ?? []) check(js)
}
for (const size of Object.values(manifest.icons ?? {})) check(size)
for (const size of Object.values(manifest.action?.default_icon ?? {})) check(size)

// LiteRT-LM WASM must be bundled locally (MV3 forbids remote code).
const wasmDir = resolve(outDir, 'wasm')
if (!existsSync(resolve(wasmDir, 'litertlm_wasm_internal.js'))) {
  missing.push('wasm/litertlm_wasm_internal.js')
}
if (!existsSync(resolve(wasmDir, 'litertlm_wasm_internal.wasm'))) {
  missing.push('wasm/litertlm_wasm_internal.wasm')
}

if (missing.length > 0) {
  console.error('ERROR: ビルド成果物が不完全です:')
  for (const m of missing) console.error(' -', m)
  process.exit(1)
}

console.log('OK: GemMurmur 拡張は読み込み可能な状態です')
console.log(`Version: ${manifest.version}`)
console.log('')
console.log('Chrome で次のフォルダ「だけ」を読み込んでください:')
console.log(outDir)
