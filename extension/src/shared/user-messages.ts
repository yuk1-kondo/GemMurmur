import type { ResolvedLanguage } from './types'

export const USER_MESSAGES = {
  webgpuUnsupported: 'WebGPUないじゃん\nGemMurmurはこの環境では動きません',
  modelLoadFailed: 'モデル読めねー！！\n再読み込みしてみる？',
  modelLoadFailedWithReason: (reason: string): string => `モデル読めねー！！\n${reason}`,
  memoryError: 'メモリ足りねー！！\n他のタブとかアプリを閉じてくれ',
  gemmaThinking: 'ざわ…ざわ…',
  /** Scrolling murmurs while Gemma is generating (shown as comments, not a corner badge). */
  gemmaThinkingLines: {
    ja: ['ざわ…', 'ざわ…ざわ…', 'ざわ…', '……ざわ'],
    en: ['murmur…', 'the crowd stirs…', 'whisper…'],
    'zh-Hans': ['骚动…', '骚动…骚动…', '……'],
    'zh-Hant': ['騷動…', '騷動…騷動…', '……'],
  },
  modelLoading: 'モデル読み込み中…',
  modelPending: 'Gemma準備中…\nポップアップからモデルを読み込んでください',
  privatePage: (language: ResolvedLanguage): string =>
    language === 'ja'
      ? 'ここでは静かにしておきます。'
      : 'GemMurmur is unavailable on private pages.',
} as const
