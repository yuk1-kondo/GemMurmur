/** Spec §11 — provisional queue values */
export const QUEUE = {
  batchSize: 8,
  minBuffer: 4,
  targetBuffer: 16,
  maxBuffer: 32,
  ttlMs: 90_000,
} as const

/** Spec §10 — comment length */
export const COMMENT_LENGTH = {
  softMax: 48,
  hardMax: 64,
} as const

/** Spec §15 — interaction thresholds */
export const INTERACTION = {
  /**
   * Fast-scroll slang fires when average speed over the sample window
   * reaches this many viewport-heights per second. ~0.9 ≈ brisk trackpad skim.
   */
  fastScrollScreensPerSec: 0.9,
  /** Window used to measure scroll speed (instant per-event speed is too noisy). */
  fastScrollSampleMs: 280,
  /** Minimum distance in the sample window before speed is evaluated. */
  fastScrollMinDistancePx: 120,
  idleMs: 30_000,
  oscillateWindowMs: 20_000,
  oscillatePasses: 3,
  rapidClickWindowMs: 3_000,
  rapidClickCount: 5,
  tabReturnAwayMs: 30_000,
  /** Per-operation cooldown (scroll / idle / etc.). Shorter = livelier crowd. */
  sameEventCooldownMs: 18_000,
  sameTextCooldownMs: 20 * 60_000,
  /** Mouse-cursor reactions (shake / fast sweep). */
  mouseFastPxPerMs: 2.5,
  mouseFastMinDistancePx: 60,
  mouseShakeReversals: 6,
  mouseShakeWindowMs: 800,
  mouseShakeMinDeltaPx: 6,
  /** Mouse reactions should feel responsive, so use a short per-event cooldown. */
  mouseEventCooldownMs: 7_000,
  /** Fast-scroll slang can repeat often while the user keeps skimming. */
  fastScrollCooldownMs: 2_400,
} as const

/** Spec §13 — buzz mode */
export const BUZZ = {
  startAfterMs: 60 * 60_000,
  durationMs: 15 * 60_000,
  awayResetMs: 15 * 60_000,
  idleGapMs: 60_000,
  tickMs: 5_000,
} as const

/** Spec §18 — font sizes (base; scaled by DPR) */
export const FONT_SIZE_PX: Record<'small' | 'medium' | 'large' | 'xl', number> = {
  small: 34,
  medium: 48,
  large: 62,
  xl: 80,
}

export const FONT_STACK = [
  '"Noto Sans"',
  '"Noto Sans JP"',
  '"Noto Sans SC"',
  '"Noto Sans TC"',
  '"Yu Gothic"',
  'Meiryo',
  '"Microsoft YaHei"',
  '"PingFang SC"',
  '"PingFang TC"',
  'sans-serif',
].join(', ')

export const MODEL = {
  id: 'gemma-4-E2B-it-web',
  url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm',
  /** Approximate download size shown in UI (bytes). Verified later in Phase D. */
  approxBytes: 2_000_000_000,
  cacheName: 'murmur-model-v1',
} as const

export const OVERLAY_ROOT_ID = 'murmur-root'
export const OVERLAY_Z_INDEX = 2147483646

export const DISPLAY = {
  baseDurationMs: 8_500,
  minDurationMs: 4_500,
  maxDurationMs: 16_000,
  /** Caps; actual lane count also scales with viewport height. */
  normalLaneCount: 9,
  busyLaneCount: 13,
  buzzLaneCount: 18,
  spawnIntervalNormalMs: 2_000,
  spawnIntervalBusyMs: 1_100,
  spawnIntervalBuzzMs: 380,
  /** Multiply base spawn interval by random factor in [min, max] */
  spawnJitterMin: 0.55,
  spawnJitterMax: 1.85,
  /** Chance of a short burst (2–3 comments close together) */
  spawnBurstChance: 0.12,
  /** Chance of a longer quiet gap between comments */
  spawnPauseChance: 0.08,
  spawnPauseMultiplierMin: 2.0,
  spawnPauseMultiplierMax: 3.6,
  /** Extra random gap between comments inside the same burst (ms). */
  burstStaggerMinMs: 80,
  burstStaggerMaxMs: 420,
  /** Per-comment font scale multiplier range */
  fontSizeScaleMin: 0.78,
  fontSizeScaleMax: 1.48,
  ambientIntervalMs: 14_000,
  modelWaitAmbientIntervalMs: 10_000,
  /** Rule-based ambient refill only while the model is not ready */
  ruleBootBatch: 4,
  ruleAmbientBatch: 3,
} as const

/** DOM extraction limits (content script). */
export const EXTRACTION = {
  maxContentRoots: 4,
  maxScanElements: 100,
  minCharsBeforeStop: 2_800,
  viewportTextMax: 3_500,
  nearbyTextMax: 2_500,
} as const

/** Generation / inference tuning (not exposed in popup). */
export const GENERATION = {
  // Total token budget (input + output) for the on-device LLM executor.
  // Page-context prompts can reach ~700+ tokens, so this must comfortably
  // exceed the prompt size plus generated output or generation is rejected.
  maxSequenceTokens: 2_048,
  gemmaBatchCap: 8,
  gemmaRefillMinGapMs: 5_000,
  contextRefreshMs: 20_000,
} as const

/** Temporary: only show Gemma-generated comments (no rule-based ambient fallbacks). */
export const FEATURES = {
  gemmaOnlyComments: true,
  /**
   * Operation reactions (scroll / idle / mouse / etc.) flow even in Gemma-only mode.
   * Tagged as source: 'interaction' so they are not filtered out.
   */
  operationReactions: true,
} as const

export const STORAGE_KEYS = {
  settings: 'murmur.settings',
  buzz: 'murmur.buzz',
  model: 'murmur.model',
  /** Active developer-demo toggles (popup ↔ content). */
  demo: 'murmur.demo',
} as const
