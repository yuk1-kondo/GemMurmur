import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const readme = [
  'Murmur 拡張機能の読み込み方',
  '',
  `バージョン: ${pkg.version}`,
  '',
  'このフォルダ（dist）を Chrome に読み込んでください。',
  '',
  '手順:',
  '1. chrome://extensions を開く',
  '2. 右上の「デベロッパーモード」を ON',
  '3. 「パッケージ化されていない拡張機能を読み込む」をクリック',
  '4. このフォルダ（dist）を選択',
  '   ※ manifest.json ファイルではなく、フォルダを選ぶこと',
  '   ※ extension 直下（src がある場所）は選ばないこと',
  '',
  '互換: extension/chrome-extension も同じ内容です（ビルド後に自動リンク）',
  '',
  `フルパス: ${outDir}`,
].join('\n')

writeFileSync(resolve(outDir, 'README-このフォルダを読み込む.txt'), readme, 'utf8')
console.log('Wrote dist/README-このフォルダを読み込む.txt')
