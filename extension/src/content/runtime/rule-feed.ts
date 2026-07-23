import { DISPLAY, FEATURES } from '@/shared/constants'
import { recordMetric } from '@/shared/metrics'
import {
  createAmbientBatch,
  createBootBatch,
  createInteractionComment,
  createPendingModelBatch,
  createRuleComment,
  createSlangComment,
  createThinkingMurmurs,
} from '@/shared/rule-comments/factory'
import { USER_MESSAGES } from '@/shared/user-messages'
import type {
  CommentDraft,
  DensityMode,
  InteractionEventType,
  ResolvedLanguage,
} from '@/shared/types'
import { runtime } from './state'

function pushToBuffer(comments: CommentDraft[]): void {
  runtime.buffer?.push(comments)
}

/**
 * Instant audience reactions to user operations (scroll, idle, mouse, etc.).
 * Uses prewritten multilingual pools — no Gemma wait — and stays allowed even
 * while Gemma-only mode suppresses ambient rule comments.
 */
export function showInteractionComment(
  event: InteractionEventType,
  language: ResolvedLanguage,
): void {
  if (!FEATURES.operationReactions || !runtime.allowed) return
  // pagehide "navigate" is noisy during SPA transitions; skip in production stream.
  if (event === 'navigate') return

  // Fast scroll → show slang immediately (don't wait for the spawn loop).
  if (event === 'fast_scroll') {
    presentNow(createSlangComment(language))
    if (Math.random() < 0.55) {
      window.setTimeout(() => {
        if (!runtime.allowed || !runtime.renderer) return
        presentNow(createSlangComment(language))
      }, 120 + Math.random() * 220)
    }
    return
  }

  presentNow(createInteractionComment(language, event))
}

/** Show an interaction comment right away; also queue it if the renderer is busy. */
function presentNow(comment: CommentDraft): void {
  if (runtime.renderer) {
    runtime.renderer.enqueue(comment)
    return
  }
  runtime.buffer?.pushFront(comment)
}

/** Show Gemma-thinking as scrolling murmurs instead of a corner badge. */
export function showThinkingMurmurs(language: ResolvedLanguage): void {
  if (!runtime.allowed || !runtime.buffer) return
  const lines = USER_MESSAGES.gemmaThinkingLines[language] ?? USER_MESSAGES.gemmaThinkingLines.ja
  const batch = createThinkingMurmurs(language, lines, 2 + (Math.random() < 0.4 ? 1 : 0))
  // Push in reverse so the first murmur is presented first.
  for (let i = batch.length - 1; i >= 0; i -= 1) {
    runtime.buffer.pushFront(batch[i])
  }
}

export function seedBootComments(language: ResolvedLanguage, modelPending: boolean): void {
  if (FEATURES.gemmaOnlyComments) return
  const started = performance.now()
  const batch = createBootBatch(language, DISPLAY.ruleBootBatch, modelPending)
  pushToBuffer(batch)
  recordMetric('rule_comment_latency_ms', performance.now() - started)
}

export function refillAmbientComments(language: ResolvedLanguage, modelPending: boolean): void {
  if (FEATURES.gemmaOnlyComments) return
  const batch = modelPending
    ? createPendingModelBatch(language, DISPLAY.ruleAmbientBatch)
    : createAmbientBatch(language, DISPLAY.ruleAmbientBatch)
  pushToBuffer(batch)
}

export function onDensityChange(density: DensityMode, language: ResolvedLanguage): void {
  if (FEATURES.gemmaOnlyComments) return
  if (density !== 'buzz') return
  const batch = Array.from({ length: 3 }, () => createRuleComment(language, 'buzz'))
  pushToBuffer(batch)
}
