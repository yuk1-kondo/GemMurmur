/**
 * Phase D tuning notes (provisional → measure on device).
 *
 * Success targets (spec §29):
 * - First rule comment: < 1s
 * - First Gemma comment: target < 10s
 * - Buffer underrun: < 5%
 * - Overlay average FPS: >= 50
 * - Page-related comments: >= 80%
 *
 * Adjust DISPLAY / QUEUE / INTERACTION / BUZZ in constants.ts after measurement.
 * Do not expose these knobs in the popup (spec §27.2).
 */

export const TUNING_CHECKLIST = [
  'rule_comment_latency_ms',
  'gemma_first_comment_latency_ms',
  'buffer_underrun_rate',
  'overlay_fps',
  'duplicate_comment_rate',
  'unsafe_comment_rate',
  'interaction_false_positive_rate',
  'language_mismatch_rate',
] as const
