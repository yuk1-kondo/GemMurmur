import type { DensityMode, MurmurSettings, PageContext, ResolvedLanguage } from '@/shared/types'
import type { LocalCommentBuffer } from '../queue/local-buffer'
import type { CommentRenderer } from '../renderer/engine'
import type { InteractionDetector } from '../events/detector'

export const runtime = {
  settings: null as MurmurSettings | null,
  density: 'normal' as DensityMode,
  language: 'ja' as ResolvedLanguage,
  pageContext: null as PageContext | null,
  modelReady: false,
  allowed: false,
  paused: false,
  renderer: null as CommentRenderer | null,
  detector: null as InteractionDetector | null,
  buffer: null as LocalCommentBuffer | null,
  spawnTimer: null as number | null,
  ambientTimer: null as number | null,
  activityTimer: null as number | null,
  contextTimer: null as number | null,
  lastGemmaRequestAt: 0,
  currentPageKey: '',
  navigationHooked: false,
  unmountControls: null as (() => void) | null,
  gemmaRequestStartedAt: 0,
}
