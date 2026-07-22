import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../package.json' with { type: 'json' }

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
// A local Vite dev session may own `dist`; allow release packaging from an
// isolated production directory without racing its hot-reload output.
const distDir = resolve(rootDir, process.env.MURMUR_DIST_DIR ?? 'dist')
const releaseDir = resolve(rootDir, 'store')
const output = resolve(releaseDir, `GemMurmur-v${pkg.version}-chrome-web-store.zip`)

if (!existsSync(resolve(distDir, 'manifest.json'))) {
  throw new Error('dist/manifest.json がありません。先に npm run build を実行してください。')
}

mkdirSync(releaseDir, { recursive: true })
rmSync(output, { force: true })

execFileSync('zip', ['-X', '-r', output, '.', '-x', '*.DS_Store'], {
  cwd: distDir,
  stdio: 'inherit',
})

const entries = execFileSync('unzip', ['-Z1', output], { encoding: 'utf8' }).split('\n')
if (!entries.includes('manifest.json')) {
  throw new Error('Web Store ZIP の直下に manifest.json がありません。')
}
if (entries.some((entry) => entry.startsWith('dist/'))) {
  throw new Error('Web Store ZIP に不要な dist/ 階層が含まれています。')
}

console.log(`Created ${output}`)
