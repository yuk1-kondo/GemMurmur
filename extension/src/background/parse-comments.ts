import { QUEUE } from '@/shared/constants'
import { createId } from '@/shared/id'
import { detectLanguageFromText } from '@/shared/language'
import { sanitizeCommentText } from '@/shared/safety'
import { isSimilarComment } from '@/shared/text-dedup'
import type { CommentCategory, CommentDraft, CommentEmotion, PageContext, ResolvedLanguage } from '@/shared/types'

const CATEGORIES = new Set<CommentCategory>([
  'content',
  'summary',
  'question',
  'tech',
  'tsukkomi',
  'empathy',
  'interaction',
  'long_session',
  'chitchat',
  'sarcasm',
  'crowd',
])

const EMOTIONS = new Set<CommentEmotion>([
  'neutral',
  'curious',
  'skeptical',
  'excited',
  'tired',
  'amused',
  'worried',
])

const META_SKIP =
  /^(title|page|content|rules|example|output|write|comment|style|visible|nearby|headings|description|hints|page type|観客|ルール|タイトル|内容|例|出力)[:：]/i

function clamp01(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(1, Math.max(0, n))
}

function normalizeRaw(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
}

function extractJsonArray(raw: string): unknown[] | null {
  const cleaned = normalizeRaw(raw)
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isEchoOfContext(text: string, context?: PageContext): boolean {
  if (!context) return false
  const normalized = text.trim().toLowerCase()
  if (normalized.length < 8) return false
  const title = context.title.trim().toLowerCase()
  if (title.length >= 8 && (normalized === title || title.includes(normalized))) return true
  for (const heading of context.headings) {
    const h = heading.trim().toLowerCase()
    if (h.length >= 10 && (normalized === h || h.includes(normalized))) return true
  }
  return false
}

function languageMatches(text: string, language: ResolvedLanguage): boolean {
  if (text.length <= 6) return true
  const detected = detectLanguageFromText(text)
  if (language === 'ja') return detected === 'ja' || detected === 'en'
  if (language === 'en') return detected === 'en' || detected === 'ja'
  if (language === 'zh-Hans') return detected === 'zh-Hans' || detected === 'zh-Hant'
  if (language === 'zh-Hant') return detected === 'zh-Hant' || detected === 'zh-Hans'
  if (language === 'ar' || language === 'hi' || language === 'ko' || language === 'ru' || language === 'th') {
    return detected === language
  }
  // Latin-script languages cannot be identified reliably without a large
  // detector. The prompt constrains output language; this only rejects a
  // clearly different script before it enters the on-page stream.
  return detected === 'en'
}

function acceptLine(
  line: string,
  language: ResolvedLanguage,
  context?: PageContext,
): string | null {
  const text = sanitizeCommentText(line)
  if (!text || text.length < 2 || text.length > 64) return null
  if (line.startsWith('{') || META_SKIP.test(line)) return null
  if (!languageMatches(text, language)) return null
  if (isEchoOfContext(text, context)) return null
  return text
}

function pushUnique(out: CommentDraft[], draft: CommentDraft): void {
  if (out.some((item) => isSimilarComment(item.text, draft.text))) return
  out.push(draft)
}

/** Soft-question endings that small models spam on gadget/tech pages. */
function softQuestionEnding(text: string): string | null {
  const t = text.trim()
  if (/なの[？?]?$/.test(t)) return 'nano'
  if (/なんですか[？?]?$/.test(t)) return 'nanodesuka'
  if (/でしょうか[？?]?$/.test(t)) return 'deshouka'
  if (/ですか[？?]?$/.test(t)) return 'desuka'
  return null
}

/**
 * Keep at most one comment per soft-question ending family in a batch,
 * so 「〜なの？」 does not dominate gadget articles.
 */
function diversifyEndings(comments: CommentDraft[]): CommentDraft[] {
  const seen = new Set<string>()
  const out: CommentDraft[] = []
  for (const comment of comments) {
    const ending = softQuestionEnding(comment.text)
    if (ending) {
      if (seen.has(ending)) continue
      seen.add(ending)
    }
    out.push(comment)
  }
  return out
}

function draftFromRow(
  row: Record<string, unknown>,
  language: ResolvedLanguage,
  now: number,
  context?: PageContext,
): CommentDraft | null {
  const text = acceptLine(String(row.text ?? ''), language, context)
  if (!text) return null
  const category = CATEGORIES.has(row.category as CommentCategory)
    ? (row.category as CommentCategory)
    : 'content'
  const emotion = EMOTIONS.has(row.emotion as CommentEmotion)
    ? (row.emotion as CommentEmotion)
    : 'neutral'
  return {
    id: createId('gemma'),
    text,
    category,
    emotion,
    importance: clamp01(row.importance, 0.35 + Math.random() * 0.45),
    targetHint: typeof row.targetHint === 'string' ? row.targetHint : undefined,
    emphasis: clamp01(row.emphasis, 0.3 + Math.random() * 0.5),
    language,
    source: 'gemma',
    createdAt: now,
    expiresAt: now + QUEUE.ttlMs,
  }
}

/**
 * Strip markdown/list markers only ("1. ", "2) ", "- ").
 * Do NOT strip bare leading digits — comments like "888888" / "100点" are valid.
 */
function stripListPrefix(line: string): string {
  return line
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/^\s*\d{1,2}[.)）]\s+/, '')
    .replace(/^["'`]|["'`]$/g, '')
    .trim()
}

function extractFromPlainLines(
  raw: string,
  language: ResolvedLanguage,
  context?: PageContext,
  maxCount: number = QUEUE.batchSize,
): CommentDraft[] {
  const now = Date.now()
  const lines = normalizeRaw(raw)
    .split('\n')
    .map((line) => stripListPrefix(line))

  const out: CommentDraft[] = []
  for (const line of lines) {
    const text = acceptLine(line, language, context)
    if (!text) continue
    pushUnique(out, {
      id: createId('gemma'),
      text,
      category: 'content',
      emotion: 'neutral',
      importance: 0.4 + Math.random() * 0.35,
      emphasis: 0.25 + Math.random() * 0.55,
      language,
      source: 'gemma',
      createdAt: now,
      expiresAt: now + QUEUE.ttlMs,
    })
    if (out.length >= maxCount) break
  }
  return out
}

export function parseGeneratedComments(
  raw: string,
  language: ResolvedLanguage,
  context?: PageContext,
  maxCount: number = QUEUE.batchSize,
): CommentDraft[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  const now = Date.now()
  const array = extractJsonArray(trimmed)
  if (array) {
    const out: CommentDraft[] = []
    for (const item of array) {
      if (!item || typeof item !== 'object') continue
      const draft = draftFromRow(item as Record<string, unknown>, language, now, context)
      if (draft) pushUnique(out, draft)
    }
    if (out.length > 0) return diversifyEndings(out).slice(0, maxCount)
  }

  const ndjson: CommentDraft[] = []
  for (const line of normalizeRaw(trimmed).split('\n')) {
    const candidate = line.trim()
    if (!candidate.startsWith('{')) continue
    try {
      const row = JSON.parse(candidate) as Record<string, unknown>
      const draft = draftFromRow(row, language, now, context)
      if (draft) pushUnique(ndjson, draft)
    } catch {
      // ignore malformed line
    }
  }
  if (ndjson.length > 0) return diversifyEndings(ndjson).slice(0, maxCount)

  return diversifyEndings(extractFromPlainLines(trimmed, language, context, maxCount)).slice(0, maxCount)
}
