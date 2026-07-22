import type { ResolvedLanguage } from './types'
import { text } from './ui-i18n'

export type RuntimeMessageKey =
  | 'webgpuUnsupported'
  | 'modelLoadFailed'
  | 'modelLoading'
  | 'modelPending'
  | 'privatePage'
  | 'memoryError'

const RUNTIME_COPY: Record<RuntimeMessageKey, Parameters<typeof text>[1]> = {
  webgpuUnsupported: 'runtimeWebGpuUnsupported',
  modelLoadFailed: 'runtimeModelLoadFailed',
  modelLoading: 'runtimeModelLoading',
  modelPending: 'runtimeModelPending',
  privatePage: 'runtimePrivatePage',
  memoryError: 'runtimeMemoryError',
}

export function runtimeMessage(language: ResolvedLanguage, key: RuntimeMessageKey): string {
  return text(language, RUNTIME_COPY[key])
}

export const USER_MESSAGES = {
  gemmaThinking: 'ざわ…ざわ…',
  /** Scrolling murmurs while Gemma is generating (shown as comments, not a corner badge). */
  gemmaThinkingLines: {
    ja: ['ざわ…', 'ざわ…ざわ…', 'ざわ…', '……ざわ'],
    en: ['murmur…', 'the crowd stirs…', 'whisper…'],
    'zh-Hans': ['骚动…', '骚动…骚动…', '……'],
    'zh-Hant': ['騷動…', '騷動…騷動…', '……'],
  } as Partial<Record<ResolvedLanguage, readonly string[]>>,
} as const
