import { STORAGE_KEYS } from '@/shared/constants'
import type { DemoTrigger, MurmurMessage, RuntimeState } from '@/shared/messages'
import { pageKeyFromUrl } from '@/shared/page-key'
import {
  patchSettingsInStorage,
  readRuntimeStateFromStorage,
} from '@/shared/runtime-storage'
import type { CommentLanguage, MurmurSettings } from '@/shared/types'
import {
  DEFAULT_BUZZ,
  DEFAULT_MODEL,
  DEFAULT_SETTINGS,
} from '@/shared/types'

const STORAGE_TIMEOUT_MS = 2_500
const MODEL_RENDER_THROTTLE_MS = 400

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing popup element: #${id}`)
  return el as T
}

function showInitError(message: string): void {
  const panel = document.querySelector('.panel')
  if (!panel) return
  const errorEl = document.getElementById('init-error')
  if (errorEl) {
    errorEl.hidden = false
    errorEl.textContent = message
    return
  }
  const fallback = document.createElement('p')
  fallback.className = 'init-error'
  fallback.textContent = message
  panel.prepend(fallback)
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

let enabledEl!: HTMLInputElement
let pauseEl!: HTMLButtonElement
let stopPageEl!: HTMLButtonElement
let stopSiteEl!: HTMLButtonElement
let resumeEl!: HTMLButtonElement
let languageEl!: HTMLSelectElement
let modelStatusEl!: HTMLParagraphElement
let modelProgressEl!: HTMLParagraphElement
let modelLoadEl!: HTMLButtonElement
let modelReloadEl!: HTMLButtonElement
let modelDeleteEl!: HTMLButtonElement
let modelCancelEl!: HTMLButtonElement
let demoModeEl!: HTMLInputElement
let versionEl!: HTMLSpanElement

let cache: RuntimeState = {
  settings: { ...DEFAULT_SETTINGS },
  buzz: { ...DEFAULT_BUZZ },
  model: { ...DEFAULT_MODEL },
}
let settingsWrite: Promise<void> = Promise.resolve()
let settingsRevision = 0
let lastAckedSettingsRevision = 0
let modelRequestPending = false
let modelRenderTimer: number | null = null
let controlsBound = false

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

function renderModel(state: RuntimeState = cache): void {
  const m = state.model
  modelStatusEl.textContent = `状態: ${m.status}${m.errorMessage ? ` — ${m.errorMessage}` : ''}`
  if (m.status === 'downloading' || m.status === 'loading') {
    const pct = Math.round(m.progress * 100)
    const gb = m.bytesTotal ? `${(m.bytesTotal / 1e9).toFixed(1)} GB` : '約 2.0 GB'
    modelProgressEl.textContent = `ダウンロード ${pct}% / ${gb}（端末内に保存。ページ内容は外部送信しません）`
  } else if (m.cached) {
    modelProgressEl.textContent =
      m.status === 'ready'
        ? 'モデル準備完了 — ページ内容に基づくコメントを生成中'
        : 'モデルはローカルにキャッシュ済みです'
  } else {
    modelProgressEl.textContent = '初回はモデル取得が必要です（ローカル保存）'
  }
}

function scheduleModelRender(): void {
  if (modelRenderTimer != null) return
  modelRenderTimer = window.setTimeout(() => {
    modelRenderTimer = null
    renderModel()
  }, MODEL_RENDER_THROTTLE_MS)
}

function renderSettings(state: RuntimeState = cache): void {
  if (document.activeElement !== enabledEl) {
    enabledEl.checked = state.settings.enabled
  }
  pauseEl.textContent = state.settings.paused ? '再開（一時停止中）' : '一時停止'
  if (document.activeElement !== languageEl) {
    languageEl.value = state.settings.language
  }
  if (document.activeElement !== demoModeEl) {
    demoModeEl.checked = state.settings.demoMode
  }
}

function render(state: RuntimeState = cache): void {
  renderSettings(state)
  renderModel(state)
}

function patchSettings(patch: Partial<MurmurSettings>): void {
  const revision = ++settingsRevision
  cache = { ...cache, settings: { ...cache.settings, ...patch } }
  renderSettings()

  settingsWrite = settingsWrite
    .catch(() => undefined)
    .then(async () => {
      const settings = await withTimeout(
        patchSettingsInStorage(patch),
        STORAGE_TIMEOUT_MS,
        'settings write',
      )
      if (revision === settingsRevision) {
        lastAckedSettingsRevision = revision
        cache = { ...cache, settings }
        renderSettings()
      }
    })
    .catch((error) => {
      console.error('Murmur popup: settings write failed', error)
      showInitError('設定を保存できませんでした。拡張機能を更新してからもう一度試してください。')
    })
}

function shouldIgnoreStorageSettings(): boolean {
  return settingsRevision > lastAckedSettingsRevision
}

async function syncFromStorage(): Promise<void> {
  try {
    const stored = await withTimeout(
      readRuntimeStateFromStorage(),
      STORAGE_TIMEOUT_MS,
      'settings read',
    )
    if (modelRequestPending && stored.model.status === 'idle') {
      stored.model = { ...stored.model, status: 'downloading', progress: 0, errorMessage: null }
    }
    if (shouldIgnoreStorageSettings()) {
      cache = { ...cache, buzz: stored.buzz, model: stored.model }
      renderModel()
    } else {
      cache = stored
      lastAckedSettingsRevision = settingsRevision
      render()
    }
  } catch (error) {
    console.warn('Murmur popup: storage read failed, using defaults', error)
  }
}

function applyStorageChanges(changes: Record<string, chrome.storage.StorageChange>): void {
  const settings = changes[STORAGE_KEYS.settings]?.newValue
  const buzz = changes[STORAGE_KEYS.buzz]?.newValue
  const model = changes[STORAGE_KEYS.model]?.newValue

  if (buzz != null) {
    cache = { ...cache, buzz: { ...DEFAULT_BUZZ, ...(buzz as Partial<RuntimeState['buzz']>) } }
  }
  if (model != null) {
    cache = {
      ...cache,
      model: { ...DEFAULT_MODEL, ...(model as Partial<RuntimeState['model']>) },
    }
    if (cache.model.status !== 'idle') modelRequestPending = false
    scheduleModelRender()
  }

  if (settings != null && !shouldIgnoreStorageSettings()) {
    cache = {
      ...cache,
      settings: { ...DEFAULT_SETTINGS, ...(settings as Partial<MurmurSettings>) },
    }
    lastAckedSettingsRevision = settingsRevision
    renderSettings()
  }
}

function sendBackgroundCommand(message: MurmurMessage): void {
  void chrome.runtime.sendMessage(message).catch((error) => {
    console.warn('Murmur popup: background command failed', message.type, error)
  })
}

function markModelPending(): void {
  modelRequestPending = true
  cache = {
    ...cache,
    model: { ...cache.model, status: 'downloading', progress: 0, errorMessage: null },
  }
  renderModel()
}

function bindControls(): void {
  if (controlsBound) return
  controlsBound = true

  enabledEl.addEventListener('change', () => {
    patchSettings({ enabled: enabledEl.checked })
  })

  pauseEl.addEventListener('click', () => {
    patchSettings({ paused: !cache.settings.paused })
  })

  stopPageEl.addEventListener('click', () => {
    void getActiveTab().then((tab) => {
      if (!tab?.url) return
      patchSettings({
        stoppedPages: Array.from(new Set([...cache.settings.stoppedPages, pageKeyFromUrl(tab.url)])),
      })
    })
  })

  stopSiteEl.addEventListener('click', () => {
    void getActiveTab().then((tab) => {
      if (!tab?.url) return
      patchSettings({
        stoppedDomains: Array.from(
          new Set([...cache.settings.stoppedDomains, new URL(tab.url).hostname]),
        ),
      })
    })
  })

  resumeEl.addEventListener('click', () => {
    void getActiveTab().then((tab) => {
      if (!tab?.url) return
      const key = pageKeyFromUrl(tab.url)
      const domain = new URL(tab.url).hostname
      patchSettings({
        stoppedPages: cache.settings.stoppedPages.filter((p) => p !== key),
        stoppedDomains: cache.settings.stoppedDomains.filter((d) => d !== domain),
        paused: false,
        enabled: true,
      })
    })
  })

  languageEl.addEventListener('change', () => {
    patchSettings({ language: languageEl.value as CommentLanguage })
  })

  modelLoadEl.addEventListener('click', () => {
    markModelPending()
    sendBackgroundCommand({ type: 'MODEL_DOWNLOAD' })
  })

  modelReloadEl.addEventListener('click', () => {
    markModelPending()
    sendBackgroundCommand({ type: 'MODEL_RELOAD' })
  })

  modelDeleteEl.addEventListener('click', () => {
    modelRequestPending = false
    sendBackgroundCommand({ type: 'MODEL_DELETE' })
  })

  modelCancelEl.addEventListener('click', () => {
    modelRequestPending = false
    sendBackgroundCommand({ type: 'MODEL_CANCEL_DOWNLOAD' })
  })

  demoModeEl.addEventListener('change', () => {
    patchSettings({ demoMode: demoModeEl.checked })
  })

  const errorKinds = new Set<DemoTrigger>([
    'force_error_webgpu',
    'force_error_model',
    'force_error_memory',
  ])

  const syncDemoButton = (button: HTMLButtonElement, active: boolean): void => {
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', active ? 'true' : 'false')
  }

  const readDemoMap = async (): Promise<Record<string, boolean>> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.demo)
      const raw = result[STORAGE_KEYS.demo]
      return raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, boolean>)
        : {}
    } catch {
      return {}
    }
  }

  const writeDemoMap = async (map: Record<string, boolean>): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.demo]: map })
    } catch {
      // ignore
    }
  }

  void readDemoMap().then((map) => {
    document.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach((button) => {
      const kind = button.dataset.demo as DemoTrigger
      syncDemoButton(button, Boolean(map[kind]))
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.demo as DemoTrigger
      const nextActive = button.getAttribute('aria-pressed') !== 'true'

      // Error demos are mutually exclusive in the popup UI.
      if (nextActive && errorKinds.has(kind)) {
        document.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach((other) => {
          const otherKind = other.dataset.demo as DemoTrigger
          if (otherKind !== kind && errorKinds.has(otherKind) && other.getAttribute('aria-pressed') === 'true') {
            syncDemoButton(other, false)
            sendBackgroundCommand({ type: 'DEMO_TRIGGER', kind: otherKind, active: false })
          }
        })
      }

      syncDemoButton(button, nextActive)
      void readDemoMap().then((map) => {
        if (nextActive) map[kind] = true
        else delete map[kind]
        if (nextActive && errorKinds.has(kind)) {
          for (const err of errorKinds) {
            if (err !== kind) delete map[err]
          }
        }
        void writeDemoMap(map)
      })
      sendBackgroundCommand({ type: 'DEMO_TRIGGER', kind, active: nextActive })
    })
  })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    if (
      changes[STORAGE_KEYS.settings] ||
      changes[STORAGE_KEYS.buzz] ||
      changes[STORAGE_KEYS.model]
    ) {
      applyStorageChanges(changes)
    }
  })
}

function initPopup(): void {
  enabledEl = requireElement('enabled')
  pauseEl = requireElement('pause')
  stopPageEl = requireElement('stop-page')
  stopSiteEl = requireElement('stop-site')
  resumeEl = requireElement('resume')
  languageEl = requireElement('language')
  modelStatusEl = requireElement('model-status')
  modelProgressEl = requireElement('model-progress')
  modelLoadEl = requireElement('model-load')
  modelReloadEl = requireElement('model-reload')
  modelDeleteEl = requireElement('model-delete')
  modelCancelEl = requireElement('model-cancel')
  demoModeEl = requireElement('demo-mode')
  versionEl = requireElement('app-version')
  versionEl.textContent = `v${chrome.runtime.getManifest().version}`

  render()
  bindControls()
  void syncFromStorage()
}

try {
  initPopup()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Murmur popup init failed:', error)
  showInitError(`設定画面の初期化に失敗しました: ${message}`)
}
