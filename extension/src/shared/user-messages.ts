import type { ResolvedLanguage } from './types'

export const USER_MESSAGES = {
  webgpuUnsupported: 'WebGPUないじゃん\nMurmurはこの環境では動きません',
  modelLoadFailed: 'モデル読めねー！！\n再読み込みしてみる？',
  modelLoadFailedWithReason: (reason: string): string => `モデル読めねー！！\n${reason}`,
  memoryError: 'メモリ足りねー！！\n他のタブとかアプリを閉じてくれ',
  gemmaThinking: 'ざわ…ざわ…',
  modelLoading: 'モデル読み込み中…',
  modelPending: 'Gemma準備中…\nポップアップからモデルを読み込んでください',
  privatePage: (language: ResolvedLanguage): string =>
    language === 'ja'
      ? 'ここでは静かにしておきます。'
      : 'Murmur is unavailable on private pages.',
} as const
