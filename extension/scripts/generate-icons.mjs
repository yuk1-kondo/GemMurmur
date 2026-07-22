import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Keep the toolbar icon and popup artwork in one visual system.
 * The source artwork is generated once at high resolution, then exported to
 * the three Chrome-required sizes in `public/brand/`.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = resolve(root, 'icons')
const artworkDir = resolve(root, 'public/brand')

mkdirSync(iconsDir, { recursive: true })

for (const size of [16, 48, 128]) {
  const source = resolve(artworkDir, `murmur-stream-${size}.png`)
  const destination = resolve(iconsDir, `icon-${size}.png`)
  if (!existsSync(source)) {
    throw new Error(`Missing generated icon artwork: ${source}`)
  }
  copyFileSync(source, destination)
}

console.log('Copied generated OpenMurmur icons to', iconsDir)
