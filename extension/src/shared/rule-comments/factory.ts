import { QUEUE, INTERACTION } from '../constants'
import { createId } from '../id'
import type { CommentDraft, ResolvedLanguage } from '../types'
import { normalizeCommentKey } from '../text-dedup'
import { pickRuleText, pickSlangBatch, pickSlangText, type RulePoolKey } from './pools'

export { createContextualFallbackBatch } from './contextual-fallback'

const recentTexts = new Map<string, number>()

function rememberText(text: string): void {
  const now = Date.now()
  recentTexts.set(normalizeCommentKey(text), now)
  for (const [key, at] of recentTexts) {
    if (now - at > INTERACTION.sameTextCooldownMs) recentTexts.delete(key)
  }
}

function recentSet(): Set<string> {
  return new Set(recentTexts.keys())
}

export function createRuleComment(
  language: ResolvedLanguage,
  key: RulePoolKey,
): CommentDraft {
  const text = pickRuleText(language, key, recentSet())
  rememberText(text)
  const now = Date.now()
  const emphasisRoll = Math.random()
  const category =
    key === 'ambient' || key === 'model_wait'
      ? 'chitchat'
      : key === 'buzz' || key === 'long_session'
        ? 'long_session'
        : 'interaction'
  return {
    id: createId('rule'),
    text,
    category,
    emotion:
      key === 'buzz' ? 'amused' : key === 'model_wait' ? 'curious' : key === 'idle' ? 'curious' : 'neutral',
    importance: key === 'buzz' ? 0.92 : key === 'model_wait' ? 0.55 : 0.35 + emphasisRoll * 0.45,
    emphasis:
      key === 'buzz'
        ? 0.88
        : key === 'model_wait'
          ? 0.35 + emphasisRoll * 0.35
          : key === 'ambient'
            ? 0.2 + emphasisRoll * 0.5
            : 0.4 + emphasisRoll * 0.4,
    language,
    source: 'rule',
    createdAt: now,
    expiresAt: now + QUEUE.ttlMs,
  }
}

/**
 * Build a mouse-cursor / operation reaction comment. Uses the same text pools/dedup as
 * rule comments but is tagged `source: 'interaction'` so it is allowed through
 * even while Gemma-only mode suppresses other rule-based comments.
 */
export function createInteractionComment(
  language: ResolvedLanguage,
  key: RulePoolKey,
): CommentDraft {
  const base = createRuleComment(language, key)
  return {
    ...base,
    id: createId('mouse'),
    source: 'interaction',
    emotion: 'amused',
    emphasis: Math.max(base.emphasis, 0.55),
  }
}

/** One random net-slang line (fast-scroll / crowd energy). */
export function createSlangComment(language: ResolvedLanguage): CommentDraft {
  const text = pickSlangText(language, recentSet())
  rememberText(text)
  const now = Date.now()
  return {
    id: createId('slang'),
    text,
    category: 'crowd',
    emotion: 'amused',
    importance: 0.7 + Math.random() * 0.25,
    emphasis: 0.6 + Math.random() * 0.35,
    language,
    source: 'interaction',
    createdAt: now,
    expiresAt: now + QUEUE.ttlMs,
  }
}

/** "ざわ…" murmurs while Gemma is thinking — always scroll across the screen. */
export function createThinkingMurmurs(
  language: ResolvedLanguage,
  lines: readonly string[],
  count = 2,
): CommentDraft[] {
  const now = Date.now()
  const picks = [...lines].sort(() => Math.random() - 0.5).slice(0, Math.max(1, count))
  return picks.map((text) => ({
    id: createId('zawa'),
    text,
    category: 'crowd',
    emotion: 'curious',
    importance: 0.45 + Math.random() * 0.2,
    emphasis: 0.35 + Math.random() * 0.3,
    language,
    source: 'interaction' as const,
    createdAt: now,
    expiresAt: now + QUEUE.ttlMs,
    preferredPlacement: 'scroll' as const,
  }))
}

export function createAmbientBatch(language: ResolvedLanguage, count: number): CommentDraft[] {
  return Array.from({ length: count }, () => createRuleComment(language, 'ambient'))
}

/**
 * High-energy net-slang flood for buzz mode / demo. Tagged `source: 'interaction'`
 * so it flows even while Gemma-only mode suppresses other rule comments.
 */
export function createBuzzFloodBatch(language: ResolvedLanguage, count: number): CommentDraft[] {
  const now = Date.now()
  return pickSlangBatch(language, count).map((text) => {
    rememberText(text)
    return {
      id: createId('buzz'),
      text,
      category: 'crowd',
      emotion: 'amused',
      importance: 0.85 + Math.random() * 0.15,
      emphasis: 0.7 + Math.random() * 0.3,
      language,
      source: 'interaction',
      createdAt: now,
      expiresAt: now + QUEUE.ttlMs,
    }
  })
}

/** Mix ambient + model-wait lines while Gemma is loading or not downloaded. */
export function createPendingModelBatch(language: ResolvedLanguage, count: number): CommentDraft[] {
  const batch: CommentDraft[] = []
  for (let i = 0; i < count; i++) {
    const key: RulePoolKey = i === 0 || Math.random() < 0.45 ? 'model_wait' : 'ambient'
    batch.push(createRuleComment(language, key))
  }
  return batch
}

export function createBootBatch(
  language: ResolvedLanguage,
  count: number,
  modelPending: boolean,
): CommentDraft[] {
  if (!modelPending) return createAmbientBatch(language, count)
  return createPendingModelBatch(language, count)
}
