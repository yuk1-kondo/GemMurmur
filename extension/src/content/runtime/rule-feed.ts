import { DISPLAY, FEATURES } from '@/shared/constants'
import { recordMetric } from '@/shared/metrics'
import {
  createAmbientBatch,
  createBootBatch,
  createInteractionComment,
  createPendingModelBatch,
  createRuleComment,
} from '@/shared/rule-comments/factory'
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

/** Mouse-cursor reactions (shake / fast sweep). Other operation comments stay off. */
export function showInteractionComment(
  event: InteractionEventType,
  language: ResolvedLanguage,
): void {
  if (!FEATURES.mouseReactions || !runtime.allowed) return
  if (event !== 'mouse_shake' && event !== 'mouse_fast') return
  runtime.buffer?.pushFront(createInteractionComment(language, event))
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

