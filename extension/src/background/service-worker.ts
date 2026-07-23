import type { MurmurMessage } from '@/shared/messages'
import { readRuntimeStateFromStorage } from '@/shared/runtime-storage'
import {
  applyModelDownloadProgress,
  createGenerationDeps,
  handleMessage,
  initApp,
  onBuzzAlarm,
  probeWebGpu,
  runtimeState,
  setModel,
  type AppState,
} from './handlers/messages'
import { isOffscreenRpc, sendToOffscreen } from './offscreen-rpc'
import { installSettingsStorageSync } from './storage-sync'

const app: AppState = {
  settings: {
    enabled: true,
    paused: false,
    language: 'auto',
    stoppedPages: [],
    stoppedDomains: [],
    demoMode: false,
  },
  buzz: {
    activeMs: 0,
    inBuzz: false,
    buzzStartedAt: null,
    lastActiveAt: 0,
    density: 'normal',
  },
  model: {
    status: 'idle',
    progress: 0,
    bytesTotal: null,
    errorMessage: null,
    cached: false,
  },
  ready: false,
}

let bootPromise: Promise<void> | null = null

async function ensureModelRuntime(): Promise<boolean> {
  if (app.model.status === 'unsupported') return false
  try {
    await sendToOffscreen({ type: 'OFFSCREEN_ENSURE_MODEL' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await setModel(app, {
      ...app.model,
      status: 'error',
      errorMessage: message,
    })
    return false
  }
  return app.model.status === 'ready'
}

const generationDeps = createGenerationDeps(app, {
  setModel: (next) => setModel(app, next),
  ensureModelRuntime,
})

function bootOnce(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      await initApp(app)
      setTimeout(() => {
        void probeWebGpu(app)
        if (
          app.model.cached &&
          app.model.status !== 'unsupported' &&
          app.model.status !== 'deleted'
        ) {
          void ensureModelRuntime()
        }
      }, 0)
    })().catch((error) => {
      bootPromise = null
      console.error('GemMurmur boot failed:', error)
      throw error
    })
  }
  return bootPromise
}

function safeSendResponse(sendResponse: (response: unknown) => void, payload: unknown): void {
  try {
    sendResponse(payload)
  } catch {
    // Message channel may already be closed (e.g. popup closed).
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void bootOnce()
})

chrome.runtime.onStartup.addListener(() => {
  void bootOnce()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'murmur-buzz-tick') onBuzzAlarm(app)
})

chrome.runtime.onMessage.addListener((message: MurmurMessage, _sender, sendResponse) => {
  if (isOffscreenRpc(message.type)) return false

  if (message.type === 'OFFSCREEN_MODEL_PROGRESS') {
    applyModelDownloadProgress(app, message.progress, message.bytesTotal)
    safeSendResponse(sendResponse, { ok: true })
    return false
  }

  if (message.type === 'GET_STATE') {
    void (async () => {
      if (!app.ready) {
        safeSendResponse(sendResponse, await readRuntimeStateFromStorage())
        return
      }
      safeSendResponse(sendResponse, runtimeState(app))
    })()
    return true
  }

  if (
    message.type === 'REQUEST_COMMENTS' ||
    message.type === 'PAGE_CONTEXT' ||
    message.type === 'PAGE_UNAVAILABLE' ||
    message.type === 'INTERACTION'
  ) {
    void (async () => {
      if (!app.ready) await bootOnce()
      await handleMessage(message, app, generationDeps)
    })()
    safeSendResponse(sendResponse, { ok: true })
    return false
  }

  void (async () => {
    try {
      if (!app.ready) await bootOnce()
      return await handleMessage(message, app, generationDeps)
    } catch (error) {
      console.error('GemMurmur SW message error:', message.type, error)
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })().then((result) => safeSendResponse(sendResponse, result))

  return true
})

void bootOnce().then(() => {
  installSettingsStorageSync(app)
})
