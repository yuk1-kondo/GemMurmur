export type CommentLanguage = 'auto' | 'ja' | 'en' | 'zh-Hans' | 'zh-Hant'

export type ResolvedLanguage = 'ja' | 'en' | 'zh-Hans' | 'zh-Hant'

export type PageKind =
  | 'news'
  | 'blog'
  | 'tech'
  | 'wikipedia'
  | 'github'
  | 'sns'
  | 'video'
  | 'docs'
  | 'unknown'

export type CommentCategory =
  | 'content'
  | 'summary'
  | 'question'
  | 'tech'
  | 'tsukkomi'
  | 'empathy'
  | 'interaction'
  | 'long_session'
  | 'chitchat'
  | 'sarcasm'
  | 'crowd'

export type CommentEmotion =
  | 'neutral'
  | 'curious'
  | 'skeptical'
  | 'excited'
  | 'tired'
  | 'amused'
  | 'worried'

export type CommentSize = 'small' | 'medium' | 'large' | 'xl'

export type CommentPlacement = 'scroll' | 'top' | 'bottom' | 'center'

export type AccentColor =
  | 'white'
  | 'black'
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'

export type InteractionEventType =
  | 'fast_scroll'
  | 'idle'
  | 'oscillate'
  | 'tab_return'
  | 'bottom'
  | 'top'
  | 'rapid_click'
  | 'navigate'
  | 'mouse_shake'
  | 'mouse_fast'

export type ModelStatus =
  | 'idle'
  | 'unsupported'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error'
  | 'deleted'

export type DensityMode = 'normal' | 'busy' | 'buzz'

export interface CommentDraft {
  id: string
  text: string
  category: CommentCategory
  emotion: CommentEmotion
  importance: number
  targetHint?: string
  emphasis: number
  language: ResolvedLanguage
  source: 'rule' | 'gemma' | 'interaction'
  createdAt: number
  expiresAt: number
}

export interface DisplayComment extends CommentDraft {
  size: CommentSize
  placement: CommentPlacement
  color: AccentColor
  durationMs: number
  lane?: number
}

export interface PageContext {
  url: string
  hostname: string
  title: string
  description: string
  kind: PageKind
  language: ResolvedLanguage
  headings: string[]
  viewportText: string
  nearbyText: string
  summaryHints: string[]
  isPrivate: boolean
  privateReason?: string
}

export interface MurmurSettings {
  enabled: boolean
  paused: boolean
  language: CommentLanguage
  stoppedPages: string[]
  stoppedDomains: string[]
  demoMode: boolean
}

export interface BuzzState {
  activeMs: number
  inBuzz: boolean
  buzzStartedAt: number | null
  lastActiveAt: number
  density: DensityMode
}

export interface ModelState {
  status: ModelStatus
  progress: number
  bytesTotal: number | null
  errorMessage: string | null
  cached: boolean
}

export const DEFAULT_SETTINGS: MurmurSettings = {
  enabled: true,
  paused: false,
  language: 'auto',
  stoppedPages: [],
  stoppedDomains: [],
  demoMode: false,
}

export const DEFAULT_BUZZ: BuzzState = {
  activeMs: 0,
  inBuzz: false,
  buzzStartedAt: null,
  lastActiveAt: 0,
  density: 'normal',
}

export const DEFAULT_MODEL: ModelState = {
  status: 'idle',
  progress: 0,
  bytesTotal: null,
  errorMessage: null,
  cached: false,
}
