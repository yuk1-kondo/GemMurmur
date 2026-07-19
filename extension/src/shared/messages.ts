import type {
  BuzzState,
  CommentDraft,
  CommentLanguage,
  DensityMode,
  InteractionEventType,
  ModelState,
  MurmurSettings,
  PageContext,
  ResolvedLanguage,
} from './types'

export type MurmurMessage =
  | { type: 'GET_STATE' }
  | { type: 'STATE'; payload: RuntimeState }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SET_LANGUAGE'; language: CommentLanguage }
  | { type: 'STOP_PAGE'; pageKey: string }
  | { type: 'STOP_DOMAIN'; domain: string }
  | { type: 'RESUME_PAGE'; pageKey: string }
  | { type: 'RESUME_DOMAIN'; domain: string }
  | { type: 'SET_DEMO_MODE'; enabled: boolean }
  | { type: 'PAGE_CONTEXT'; context: PageContext }
  | { type: 'PAGE_UNAVAILABLE'; reason: string }
  | { type: 'INTERACTION'; event: InteractionEventType; language: ResolvedLanguage }
  | { type: 'ACTIVITY_TICK'; visible: boolean; interacting: boolean }
  | { type: 'REQUEST_COMMENTS'; count: number; context: PageContext }
  | { type: 'COMMENTS'; comments: CommentDraft[]; pageKey: string }
  | { type: 'DENSITY'; density: DensityMode; buzz: BuzzState }
  | { type: 'MODEL_STATUS'; model: ModelState }
  | { type: 'MODEL_DOWNLOAD' }
  | { type: 'MODEL_CANCEL_DOWNLOAD' }
  | { type: 'MODEL_RELOAD' }
  | { type: 'MODEL_DELETE' }
  | { type: 'OFFSCREEN_GENERATE'; prompt: string; requestId: string }
  | { type: 'OFFSCREEN_GENERATE_RESULT'; requestId: string; text: string | null; error?: string }
  | { type: 'OFFSCREEN_ENSURE_MODEL' }
  | { type: 'OFFSCREEN_CHECK_WEBGPU' }
  | { type: 'OFFSCREEN_CANCEL_DOWNLOAD' }
  | { type: 'OFFSCREEN_DELETE_MODEL' }
  | { type: 'OFFSCREEN_MODEL_PROGRESS'; progress: number; bytesTotal: number | null }
  | { type: 'OFFSCREEN_MODEL_READY' }
  | { type: 'OFFSCREEN_MODEL_ERROR'; message: string }
  | { type: 'SHOW_STATUS'; message: string; level: 'info' | 'error' | 'warn'; placement?: 'corner' | 'center' }
  | { type: 'CLEAR_STATUS' }
  | { type: 'DEMO_TRIGGER'; kind: DemoTrigger; active: boolean }

export type DemoTrigger =
  | 'force_fast_scroll'
  | 'force_idle'
  | 'force_buzz'
  | 'force_error_webgpu'
  | 'force_error_model'
  | 'force_error_memory'
  | 'seed_first_comment'

export interface RuntimeState {
  settings: MurmurSettings
  buzz: BuzzState
  model: ModelState
}

export function sendMessage<T extends MurmurMessage>(message: T): Promise<unknown> {
  return chrome.runtime.sendMessage(message)
}
