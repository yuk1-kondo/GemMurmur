import { COMMENT_LENGTH } from './constants'

const BLOCK_PATTERNS: RegExp[] = [
  /死ね|殺す|殺せ/i,
  /強姦|レイプ/i,
  /\bnigger\b/i,
  /\bfaggot\b/i,
  /自殺しろ|殺せ|クソ女|キモい.*(女|男)/i,
  /(kill yourself|kys)\b/i,
]

export function sanitizeCommentText(text: string): string | null {
  let cleaned = text.replace(/\s+/g, ' ').replace(/[\r\n]+/g, ' ').trim()
  if (!cleaned) return null
  if (BLOCK_PATTERNS.some((re) => re.test(cleaned))) return null
  if (cleaned.length > COMMENT_LENGTH.hardMax) {
    cleaned = cleaned.slice(0, COMMENT_LENGTH.hardMax - 1) + '…'
  }
  return cleaned
}
