import { BUZZ, MODEL } from '@/shared/constants'
import type { MurmurMessage, RuntimeState } from '@/shared/messages'
import { USER_MESSAGES } from '@/shared/user-messages'
import type { BuzzState, ModelState, MurmurSettings } from '@/shared/types'
import { broadcastAll } from '../broadcast'
import { clearBuzz, forceBuzz, tickBuzz } from '../buzz'
import { generateForContext, type GenerationDeps } from '../generation/pipeline'
import { sendToOffscreen } from '../offscreen-rpc'
import { loadBuzz, loadModel, loadSettings, saveBuzz, saveModel, saveSettings } from '../storage'

export interface AppState {
  settings: MurmurSettings
  buzz: BuzzState
  model: ModelState
  ready: boolean
}

export function createGenerationDeps(app: AppState, hooks: {
  setModel: (next: ModelState) => Promise<void>
  ensureModelRuntime: () => Promise<boolean>
}): GenerationDeps {
  return {
    getSettings: () => app.settings,
    getModel: () => app.model,
    ensureModelRuntime: hooks.ensureModelRuntime,
    onFatalModelError: async (message: string) => {
      await hooks.setModel({
        ...app.model,
        status: /webgpu/i.test(message) ? 'unsupported' : 'error',
        errorMessage: message,
      })
      await broadcastAll({
        type: 'SHOW_STATUS',
        message: /webgpu/i.test(message)
          ? USER_MESSAGES.webgpuUnsupported
          : USER_MESSAGES.modelLoadFailed,
        level: 'error',
      })
    },
  }
}

export function runtimeState(app: AppState): RuntimeState {
  return { settings: app.settings, buzz: app.buzz, model: app.model }
}

export async function setSettings(app: AppState, next: MurmurSettings): Promise<void> {
  app.settings = next
  await saveSettings(app.settings)
  // Content tabs are notified via installSettingsStorageSync (storage.onChanged).
}

export async function setBuzz(app: AppState, next: BuzzState): Promise<void> {
  const densityChanged = next.density !== app.buzz.density || next.inBuzz !== app.buzz.inBuzz
  app.buzz = next
  await saveBuzz(app.buzz)
  if (densityChanged) {
    void broadcastAll({ type: 'DENSITY', density: app.buzz.density, buzz: app.buzz })
  }
}

export async function setModel(
  app: AppState,
  next: ModelState,
  options?: { broadcast?: boolean },
): Promise<void> {
  app.model = next
  await saveModel(app.model)
  if (options?.broadcast !== false) {
    void broadcastAll({ type: 'MODEL_STATUS', model: app.model })
  }
}

let lastModelProgressPersistAt = 0

function persistModelProgress(app: AppState, next: ModelState): void {
  app.model = next
  const now = Date.now()
  if (now - lastModelProgressPersistAt < 1_000) return
  lastModelProgressPersistAt = now
  void saveModel(app.model)
}

let modelEnsureTask: Promise<void> | null = null

async function runModelEnsure(app: AppState): Promise<void> {
  try {
    await sendToOffscreen({ type: 'OFFSCREEN_ENSURE_MODEL' })
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error)
    await setModel(app, {
      ...app.model,
      status: 'error',
      errorMessage: modelErrorMessage(err),
    })
  }
}

/** Start model download/load without blocking the message response channel. */
export function scheduleModelEnsure(app: AppState): void {
  if (modelEnsureTask) return
  modelEnsureTask = runModelEnsure(app).finally(() => {
    modelEnsureTask = null
  })
}

export function applyModelDownloadProgress(
  app: AppState,
  progress: number,
  bytesTotal: number | null,
): void {
  persistModelProgress(app, {
    ...app.model,
    status: 'downloading',
    progress,
    bytesTotal,
  })
}

export function modelErrorMessage(raw: string): string {
  if (/webgpu/i.test(raw)) return 'WebGPUが使えません'
  if (/permission|host permission|failed to fetch|network/i.test(raw)) {
    return 'モデルのダウンロードに失敗しました（ネットワーク権限を確認）'
  }
  if (/cancel/i.test(raw)) return 'ダウンロードをキャンセルしました'
  return raw
}

export async function handleMessage(
  message: MurmurMessage,
  app: AppState,
  deps: GenerationDeps,
): Promise<unknown> {
  switch (message.type) {
    case 'GET_STATE':
      return runtimeState(app)
    case 'SET_ENABLED':
      await setSettings(app, { ...app.settings, enabled: message.enabled })
      return runtimeState(app)
    case 'SET_PAUSED':
      await setSettings(app, { ...app.settings, paused: message.paused })
      return runtimeState(app)
    case 'SET_LANGUAGE':
      await setSettings(app, { ...app.settings, language: message.language })
      return runtimeState(app)
    case 'STOP_PAGE': {
      const stoppedPages = Array.from(new Set([...app.settings.stoppedPages, message.pageKey]))
      await setSettings(app, { ...app.settings, stoppedPages })
      return runtimeState(app)
    }
    case 'STOP_DOMAIN': {
      const stoppedDomains = Array.from(new Set([...app.settings.stoppedDomains, message.domain]))
      await setSettings(app, { ...app.settings, stoppedDomains })
      return runtimeState(app)
    }
    case 'RESUME_PAGE':
      await setSettings(app, {
        ...app.settings,
        stoppedPages: app.settings.stoppedPages.filter((p) => p !== message.pageKey),
        paused: false,
      })
      return runtimeState(app)
    case 'RESUME_DOMAIN':
      await setSettings(app, {
        ...app.settings,
        stoppedDomains: app.settings.stoppedDomains.filter((d) => d !== message.domain),
      })
      return runtimeState(app)
    case 'SET_DEMO_MODE':
      await setSettings(app, { ...app.settings, demoMode: message.enabled })
      return runtimeState(app)
    case 'ACTIVITY_TICK': {
      const next = tickBuzz(app.buzz, {
        visible: message.visible,
        interacting: message.interacting,
      })
      await setBuzz(app, next)
      return app.buzz
    }
    case 'REQUEST_COMMENTS':
      void generateForContext(message.context, message.count, deps)
      return { ok: true }
    case 'PAGE_CONTEXT':
    case 'PAGE_UNAVAILABLE':
    case 'INTERACTION':
      return { ok: true }
    case 'MODEL_DOWNLOAD':
    case 'MODEL_RELOAD':
      await setModel(app, {
        ...app.model,
        status: 'downloading',
        progress: 0,
        errorMessage: null,
        bytesTotal: MODEL.approxBytes,
      })
      scheduleModelEnsure(app)
      return app.model
    case 'MODEL_CANCEL_DOWNLOAD':
      try {
        await sendToOffscreen({ type: 'OFFSCREEN_CANCEL_DOWNLOAD' })
      } catch {
        // ignore
      }
      await setModel(app, { ...app.model, status: 'idle', progress: 0 })
      return app.model
    case 'MODEL_DELETE':
      try {
        await sendToOffscreen({ type: 'OFFSCREEN_DELETE_MODEL' })
      } catch {
        // ignore
      }
      await setModel(app, {
        status: 'deleted',
        progress: 0,
        bytesTotal: null,
        errorMessage: null,
        cached: false,
      })
      return app.model
    case 'OFFSCREEN_MODEL_PROGRESS':
      persistModelProgress(app, {
        ...app.model,
        status: 'downloading',
        progress: message.progress,
        bytesTotal: message.bytesTotal,
      })
      return { ok: true }
    case 'OFFSCREEN_MODEL_READY':
      await setModel(app, {
        ...app.model,
        status: 'ready',
        progress: 1,
        cached: true,
        errorMessage: null,
      })
      return app.model
    case 'OFFSCREEN_MODEL_ERROR': {
      const unsupported = /webgpu/i.test(message.message)
      const friendly = modelErrorMessage(message.message)
      await setModel(app, {
        ...app.model,
        status: unsupported ? 'unsupported' : 'error',
        errorMessage: friendly,
      })
      await broadcastAll({
        type: 'SHOW_STATUS',
        message: unsupported
          ? USER_MESSAGES.webgpuUnsupported
          : USER_MESSAGES.modelLoadFailedWithReason(friendly),
        level: 'error',
      })
      void broadcastAll({ type: 'MODEL_STATUS', model: app.model })
      return app.model
    }
    case 'DEMO_TRIGGER':
      if (message.kind === 'force_buzz') {
        await setBuzz(app, message.active ? forceBuzz(app.buzz) : clearBuzz(app.buzz))
      }
      await broadcastAll(message)
      return { ok: true }
    default:
      return { ok: true }
  }
}

export async function initApp(app: AppState): Promise<void> {
  if (app.ready) return
  app.settings = await loadSettings()
  app.buzz = await loadBuzz()
  app.model = await loadModel()
  // A popup can update settings while this worker is waking. Read settings
  // once more before exposing the in-memory state to generation.
  app.settings = await loadSettings()
  app.ready = true
  chrome.alarms.create('murmur-buzz-tick', { periodInMinutes: 1 })
}

export async function probeWebGpu(app: AppState): Promise<void> {
  try {
    const result = (await sendToOffscreen({
      type: 'OFFSCREEN_CHECK_WEBGPU',
    })) as { supported?: boolean }
    if (result?.supported === false) {
      await setModel(app, {
        ...app.model,
        status: 'unsupported',
        errorMessage: 'WebGPU is not available',
      })
      await broadcastAll({
        type: 'SHOW_STATUS',
        message: USER_MESSAGES.webgpuUnsupported,
        level: 'error',
      })
      void broadcastAll({ type: 'MODEL_STATUS', model: app.model })
    }
  } catch (error) {
    console.warn('WebGPU probe failed:', error)
  }
}

export function onBuzzAlarm(app: AppState): void {
  if (app.buzz.lastActiveAt > 0 && Date.now() - app.buzz.lastActiveAt >= BUZZ.awayResetMs) {
    void setBuzz(app, {
      activeMs: 0,
      inBuzz: false,
      buzzStartedAt: null,
      lastActiveAt: 0,
      density: 'normal',
    })
  }
}
