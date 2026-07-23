import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

/**
 * GemMurmur toolbar icons: dark rounded tile + amber gem + murmur dashes.
 * Drawn procedurally so `npm run build` always regenerates consistent assets.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = resolve(root, 'icons')
mkdirSync(iconsDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function setPixel(rgba, size, x, y, r, g, b, a = 255) {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (xi < 0 || yi < 0 || xi >= size || yi >= size) return
  const i = (yi * size + xi) * 4
  rgba[i] = r
  rgba[i + 1] = g
  rgba[i + 2] = b
  rgba[i + 3] = a
}

function fillCircle(rgba, size, cx, cy, radius, color) {
  const r2 = radius * radius
  const x0 = Math.floor(cx - radius)
  const x1 = Math.ceil(cx + radius)
  const y0 = Math.floor(cy - radius)
  const y1 = Math.ceil(cy + radius)
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= r2) {
        setPixel(rgba, size, x, y, color[0], color[1], color[2], color[3] ?? 255)
      }
    }
  }
}

function fillRoundedRect(rgba, size, x0, y0, x1, y1, radius, color) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y += 1) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x += 1) {
      const px = x + 0.5
      const py = y + 0.5
      const cx = Math.min(Math.max(px, x0 + radius), x1 - radius)
      const cy = Math.min(Math.max(py, y0 + radius), y1 - radius)
      const dx = px - cx
      const dy = py - cy
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(rgba, size, x, y, color[0], color[1], color[2], color[3] ?? 255)
      }
    }
  }
}

function fillDiamond(rgba, size, cx, cy, halfW, halfH, color) {
  for (let y = Math.floor(cy - halfH); y <= Math.ceil(cy + halfH); y += 1) {
    for (let x = Math.floor(cx - halfW); x <= Math.ceil(cx + halfW); x += 1) {
      const nx = Math.abs((x + 0.5 - cx) / halfW)
      const ny = Math.abs((y + 0.5 - cy) / halfH)
      if (nx + ny <= 1) {
        setPixel(rgba, size, x, y, color[0], color[1], color[2], color[3] ?? 255)
      }
    }
  }
}

function fillCapsule(rgba, size, x0, y, x1, thickness, color) {
  const r = thickness / 2
  fillRoundedRect(rgba, size, x0, y - r, x1, y + r, r, color)
}

function makePng(size) {
  const rgba = Buffer.alloc(size * size * 4)

  // Transparent outside; dark rounded tile inside.
  const pad = size * 0.06
  const radius = size * 0.22
  fillRoundedRect(rgba, size, pad, pad, size - pad, size - pad, radius, [22, 22, 28, 255])

  // Soft inner glow ring
  fillCircle(rgba, size, size * 0.42, size * 0.5, size * 0.28, [36, 34, 42, 255])

  // Amber gem (diamond) — the "Gem" in GemMurmur
  const gx = size * 0.38
  const gy = size * 0.5
  fillDiamond(rgba, size, gx, gy, size * 0.2, size * 0.26, [240, 168, 48, 255])
  fillDiamond(rgba, size, gx - size * 0.02, gy - size * 0.04, size * 0.1, size * 0.13, [
    255, 224, 140, 255,
  ])
  fillDiamond(rgba, size, gx + size * 0.05, gy + size * 0.06, size * 0.07, size * 0.09, [
    196, 120, 28, 255,
  ])

  // Murmur dashes — scrolling comment streaks
  const ink = [244, 240, 235, 255]
  const accent = [255, 122, 180, 255]
  fillCapsule(rgba, size, size * 0.58, size * 0.34, size * 0.88, size * 0.08, ink)
  fillCapsule(rgba, size, size * 0.62, size * 0.5, size * 0.9, size * 0.07, accent)
  fillCapsule(rgba, size, size * 0.56, size * 0.66, size * 0.84, size * 0.07, ink)

  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [16, 48, 128]) {
  writeFileSync(resolve(iconsDir, `icon-${size}.png`), makePng(size))
}

console.log('Generated GemMurmur icons in', iconsDir)
