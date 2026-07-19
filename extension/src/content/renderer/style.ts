import { DISPLAY, FONT_SIZE_PX } from '@/shared/constants'
import type { AccentColor, CommentCategory, CommentSize, DensityMode } from '@/shared/types'

const ACCENT_HEX: Record<AccentColor, string> = {
  white: '#ffffff',
  black: '#111111',
  red: '#ff3b3b',
  blue: '#4aa3ff',
  yellow: '#ffe14a',
  green: '#5dff8a',
  purple: '#c58bff',
  orange: '#ff9a3c',
  pink: '#ff7ad9',
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
  if (Math.random() < 0.1 + draftEmphasis * 0.15) {
    const accents: AccentColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'pink']
    return accents[Math.floor(Math.random() * accents.length)]
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
    `-2px -2px 0 ${edge}`,
    `2px -2px 0 ${edge}`,
    `-2px 2px 0 ${edge}`,
    `2px 2px 0 ${edge}`,
    `0 0 8px rgba(0,0,0,0.35)`,
  ].join(', ')
}

export function colorCss(color: AccentColor): string {
  return ACCENT_HEX[color]
}
