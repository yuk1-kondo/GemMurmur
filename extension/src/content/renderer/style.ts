import { DISPLAY, FONT_SIZE_PX } from '@/shared/constants'
import type { AccentColor, CommentCategory, CommentSize, DensityMode } from '@/shared/types'

const ACCENT_HEX: Record<AccentColor, string> = {
  white: '#f8f8f8',
  black: '#0d0d0d',
  red: '#ff5a5f',
  blue: '#5b8cff',
  yellow: '#f5c451',
  green: '#10a37f',
  purple: '#a78bfa',
  orange: '#fb923c',
  pink: '#f472b6',
}

let cachedDarkBg: boolean | null = null

export function resetBackgroundCache(): void {
  cachedDarkBg = null
}

export function estimateBackgroundIsDark(): boolean {
  if (cachedDarkBg != null) return cachedDarkBg
  const bg = getComputedStyle(document.body).backgroundColor
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!match) return false
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  cachedDarkBg = luminance < 0.45
  return cachedDarkBg
}

export function pickColor(draftEmphasis: number, preferDarkText: boolean): AccentColor {
  // Normal mode stays legible, with occasional colorful comments to keep the
  // crowd lively without turning every page into Buzz mode.
  if (Math.random() < (draftEmphasis > 0.8 ? 0.36 : 0.24)) {
    const colors: AccentColor[] = ['green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'red']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  return preferDarkText ? 'black' : 'white'
}

/** Interaction reactions retain the same restrained palette as normal comments. */
export function pickSlangColor(preferDarkText: boolean, isBuzz = false): AccentColor {
  if (isBuzz) {
    const colors: AccentColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'pink']
    // A little white/black preserves contrast and makes the color beats pop.
    if (Math.random() < 0.06) return preferDarkText ? 'black' : 'white'
    return colors[Math.floor(Math.random() * colors.length)]
  }
  if (Math.random() < 0.3) {
    const colors: AccentColor[] = ['green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'red']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  return preferDarkText ? 'black' : 'white'
}

export function pickSize(
  emphasis: number,
  density: DensityMode,
  text: string,
  importance: number,
): CommentSize {
  const roll = Math.random()
  const len = text.length
  const punchy = len <= 10
  const long = len >= 28

  if (density === 'buzz' && roll < 0.35) return roll < 0.18 ? 'xl' : 'large'
  if (emphasis > 0.78 || importance > 0.82) {
    return roll < 0.7 ? 'xl' : 'large'
  }
  if (punchy && roll < 0.55) return roll < 0.28 ? 'xl' : 'large'
  if (long && roll < 0.22) return 'medium'
  if (roll < 0.08) return 'small'
  if (roll < 0.38) return 'medium'
  if (roll < 0.78) return 'large'
  return 'xl'
}

/** Fully random size for slang comments. */
export function pickSlangSize(isBuzz = false): CommentSize {
  const roll = Math.random()
  if (isBuzz) {
    if (roll < 0.08) return 'small'
    if (roll < 0.24) return 'medium'
    if (roll < 0.62) return 'large'
    return 'xl'
  }
  if (roll < 0.2) return 'small'
  if (roll < 0.45) return 'medium'
  if (roll < 0.75) return 'large'
  return 'xl'
}

export function pickPlacement(
  category: CommentCategory,
  emphasis: number,
  text: string,
): 'scroll' | 'top' | 'bottom' | 'center' {
  const roll = Math.random()
  const punchy = text.length <= 14

  if ((emphasis > 0.65 || punchy || category === 'tsukkomi') && roll < 0.16) return 'center'
  if (emphasis > 0.75 && roll < 0.22) return roll < 0.5 ? 'top' : 'bottom'
  if (category === 'long_session' && roll < 0.28) return 'top'
  return 'scroll'
}

/**
 * Random placement for slang: scroll / center / subtitle band (top・bottom).
 * Weighted toward scroll so the stream stays readable.
 */
export function pickSlangPlacement(isBuzz = false): 'scroll' | 'top' | 'bottom' | 'center' {
  const roll = Math.random()
  if (isBuzz) {
    if (roll < 0.78) return 'scroll'
    if (roll < 0.86) return 'top'
    if (roll < 0.94) return 'bottom'
    return 'center'
  }
  if (roll < 0.5) return 'scroll'
  if (roll < 0.68) return 'top'
  if (roll < 0.86) return 'bottom'
  return 'center'
}

export function durationForText(text: string, size: CommentSize): number {
  const len = Math.min(64, text.length)
  const sizeFactor = size === 'xl' ? 1.25 : size === 'large' ? 1.1 : size === 'small' ? 0.85 : 1
  const lengthFactor = 0.7 + (len / 64) * 0.8
  const jitter = 0.85 + Math.random() * 0.35
  const ms = DISPLAY.baseDurationMs * sizeFactor * lengthFactor * jitter
  return Math.round(Math.min(DISPLAY.maxDurationMs, Math.max(DISPLAY.minDurationMs, ms)))
}

export function fontSizePx(size: CommentSize, randomScale = true): number {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const scale = 0.92 + (dpr - 1) * 0.14
  let px = FONT_SIZE_PX[size] * scale
  if (randomScale) {
    const jitter =
      DISPLAY.fontSizeScaleMin + Math.random() * (DISPLAY.fontSizeScaleMax - DISPLAY.fontSizeScaleMin)
    px *= jitter
  }
  return Math.round(px)
}

export function textShadow(color: AccentColor): string {
  const edge = color === 'black' ? '#ffffff' : '#111111'
  return [
    `-1px -1px 0 ${edge}`,
    `1px -1px 0 ${edge}`,
    `-1px 1px 0 ${edge}`,
    `1px 1px 0 ${edge}`,
    '0 1px 2px rgb(0 0 0 / 22%)',
  ].join(', ')
}

export function colorCss(color: AccentColor): string {
  return ACCENT_HEX[color]
}
