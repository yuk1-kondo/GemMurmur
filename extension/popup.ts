import { STORAGE_KEYS } from '@/shared/constants'
import { SUPPORTED_LANGUAGES } from '@/shared/language'
import type { MurmurMessage, RuntimeState } from '@/shared/messages'
import { pageKeyFromUrl } from '@/shared/page-key'
import {
  patchSettingsInStorage,
  readRuntimeStateFromStorage,
} from '@/shared/runtime-storage'
import type { CommentLanguage, MurmurSettings } from '@/shared/types'
import { buzzText, languageLabel, supportText, text, uiLanguage } from '@/shared/ui-i18n'
import {
  DEFAULT_BUZZ,
  DEFAULT_MODEL,
  DEFAULT_SETTINGS,
} from '@/shared/types'

const STORAGE_TIMEOUT_MS = 2_500
const MODEL_RENDER_THROTTLE_MS = 400

type StatusTone = 'ready' | 'muted' | 'error'

interface ActivePageState {
  canControl: boolean
  isPrivate: boolean
  stoppedOnPage: boolean
  stoppedOnSite: boolean
}

interface ContentPageStatus {
  isPrivate: boolean
}

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

function isContentPageStatus(value: unknown): value is ContentPageStatus {
  return (
    value != null &&
    typeof value === 'object' &&
    'isPrivate' in value &&
    typeof value.isPrivate === 'boolean'
  )
}

function isHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

let enabledEl!: HTMLInputElement
let pauseEl!: HTMLButtonElement
let stopPageEl!: HTMLButtonElement
let stopSiteEl!: HTMLButtonElement
let resumeEl!: HTMLButtonElement
let languageEl!: HTMLSelectElement
let statusDotEl!: HTMLSpanElement
let statusLabelEl!: HTMLParagraphElement
let modelStatusEl!: HTMLParagraphElement
let modelProgressEl!: HTMLParagraphElement
let modelProgressWrapEl!: HTMLDivElement
let modelProgressStageEl!: HTMLSpanElement
let modelProgressValueEl!: HTMLSpanElement
let modelProgressTrackEl!: HTMLDivElement
let modelProgressBarEl!: HTMLSpanElement
let modelLoadEl!: HTMLButtonElement
let modelReloadEl!: HTMLButtonElement
let modelDeleteEl!: HTMLButtonElement
let modelCancelEl!: HTMLButtonElement
let buzzModeEl!: HTMLButtonElement
let versionEl!: HTMLSpanElement

let cache: RuntimeState = {
  settings: { ...DEFAULT_SETTINGS },
  buzz: { ...DEFAULT_BUZZ },
  model: { ...DEFAULT_MODEL },
}
let activePage: ActivePageState = {
  canControl: false,
  isPrivate: false,
  stoppedOnPage: false,
  stoppedOnSite: false,
}
let settingsWrite: Promise<void> = Promise.resolve()
let settingsRevision = 0
let lastAckedSettingsRevision = 0
let modelRequestPending = false
let modelRenderTimer: number | null = null
let controlsBound = false
const browserPopupLanguage = uiLanguage()
let popupLanguage = browserPopupLanguage

function t(key: Parameters<typeof text>[1], variables?: Record<string, string | number>): string {
  return text(popupLanguage, key, variables)
}

function localizeStaticCopy(): void {
  document.documentElement.lang = popupLanguage
  document.documentElement.dir = popupLanguage === 'ar' ? 'rtl' : 'ltr'
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n
    element.textContent =
      key === 'buzzTitle' || key === 'buzzHelp'
        ? buzzText(popupLanguage, key === 'buzzTitle' ? 'title' : 'help')
        : key === 'supportTitle' || key === 'supportHelp'
          ? supportText(popupLanguage, key === 'supportTitle' ? 'title' : 'help')
          : t(key as Parameters<typeof text>[1])
  })
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel as Parameters<typeof text>[1]))
  })

  languageEl.replaceChildren()
  const automatic = new Option(t('automatic'), 'auto')
  languageEl.add(automatic)
  for (const language of SUPPORTED_LANGUAGES) {
    languageEl.add(new Option(languageLabel(language), language))
  }
}

/** Keep the popup chrome in the same language as the selected comment stream. */
function syncPopupLanguage(setting: CommentLanguage): void {
  const nextLanguage = setting === 'auto' ? browserPopupLanguage : setting
  if (nextLanguage === popupLanguage) return
  popupLanguage = nextLanguage
  localizeStaticCopy()
}

function renderBuzzMode(active: boolean): void {
  buzzModeEl.textContent = buzzText(popupLanguage, active ? 'off' : 'on')
  buzzModeEl.classList.toggle('is-active', active)
  buzzModeEl.setAttribute('aria-pressed', active ? 'true' : 'false')
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
  } catch {
    return undefined
  }
}

function setStatus(label: string, tone: StatusTone): void {
  statusLabelEl.textContent = label
  statusDotEl.classList.remove('is-ready', 'is-muted', 'is-error')
  statusDotEl.classList.add(`is-${tone}`)
}

function renderStatus(state: RuntimeState = cache): void {
  if (activePage.isPrivate) {
    setStatus(t('statusPageStopped'), 'muted')
    return
  }
  if (activePage.stoppedOnSite) {
    setStatus(t('statusSiteStopped'), 'muted')
    return
  }
  if (activePage.stoppedOnPage) {
    setStatus(t('statusPageStopped'), 'muted')
    return
  }
  if (!state.settings.enabled) {
    setStatus(t('statusExtensionStopped'), 'muted')
    return
  }
  if (state.settings.paused) {
    setStatus(t('statusPaused'), 'muted')
    return
  }

  const { model } = state
  if (model.status === 'ready') {
    setStatus(t('statusReady'), 'ready')
  } else if (model.status === 'downloading') {
    setStatus(t('statusDownloading', { percent: Math.round(model.progress * 100) }), 'muted')
  } else if (model.status === 'loading') {
    setStatus(t('statusLoading'), 'muted')
  } else if (model.status === 'unsupported') {
    setStatus(t('modelUnsupported'), 'error')
  } else if (model.status === 'error') {
    setStatus(t('modelFailed'), 'error')
  } else {
    setStatus(t('statusPrepare'), 'muted')
  }
}

function renderModel(state: RuntimeState = cache): void {
  const { model } = state
  const preparing = model.status === 'downloading' || model.status === 'loading'
  const ready = model.status === 'ready'
  const percent = Math.round(Math.max(0, Math.min(1, model.progress)) * 100)

  modelProgressWrapEl.hidden = !preparing
  modelLoadEl.hidden = ready
  modelReloadEl.hidden = !ready
  modelDeleteEl.hidden = !ready && !model.cached
  modelCancelEl.hidden = !preparing
  modelLoadEl.disabled = preparing

  if (preparing) {
    const stage = model.status === 'loading' ? t('statusLoading') : t('statusDownloading', { percent })
    modelStatusEl.textContent = t('modelPreparing')
    modelProgressEl.textContent = t('modelSavedDetail')
    modelProgressStageEl.textContent = stage
    modelProgressValueEl.textContent = `${percent}%`
    modelProgressTrackEl.setAttribute('aria-valuenow', String(percent))
    modelProgressBarEl.style.width = `${percent}%`
    modelLoadEl.textContent = t('modelPreparing')
    return
  }

  modelProgressBarEl.style.width = '0%'
  modelProgressTrackEl.setAttribute('aria-valuenow', '0')

  if (ready) {
    modelStatusEl.textContent = t('modelReady')
    modelProgressEl.textContent = `gemma-4-E2B · ${t('modelSaved')}`
    return
  }

  if (model.status === 'unsupported') {
    modelStatusEl.textContent = t('modelUnsupported')
    modelProgressEl.textContent = t('modelUnsupportedHelp')
    modelLoadEl.textContent = t('modelRetry')
    return
  }

  if (model.status === 'error') {
    modelStatusEl.textContent = t('modelFailed')
    modelProgressEl.textContent = t('modelRetry')
    modelLoadEl.textContent = t('modelRetry')
    return
  }

  modelStatusEl.textContent = t('statusPrepare')
  modelProgressEl.textContent = t('modelInitialSize')
  modelLoadEl.textContent = t('modelPrepare')
}

function renderSettings(state: RuntimeState = cache): void {
  const modelReady = state.model.status === 'ready'
  const stopped = activePage.stoppedOnPage || activePage.stoppedOnSite
  const unavailable = !activePage.canControl || activePage.isPrivate

  syncPopupLanguage(state.settings.language)

  if (document.activeElement !== enabledEl) {
    enabledEl.checked = state.settings.enabled
  }
  enabledEl.disabled = !modelReady || activePage.isPrivate
  pauseEl.textContent = state.settings.paused ? t('resume') : t('pause')
  pauseEl.hidden = stopped
  pauseEl.disabled = !modelReady || unavailable
  stopPageEl.disabled = !modelReady || unavailable || stopped
  stopSiteEl.disabled = !modelReady || unavailable || stopped
  resumeEl.hidden = !stopped
  resumeEl.disabled = unavailable || !stopped
  buzzModeEl.disabled = unavailable
  renderBuzzMode(state.settings.buzzMode)
  if (document.activeElement !== languageEl) {
    languageEl.value = state.settings.language
  }
}

function render(state: RuntimeState = cache): void {
  renderSettings(state)
  renderModel(state)
  renderStatus(state)
}

function scheduleModelRender(): void {
  if (modelRenderTimer != null) return
  modelRenderTimer = window.setTimeout(() => {
    modelRenderTimer = null
    render()
  }, MODEL_RENDER_THROTTLE_MS)
}

async function refreshActivePage(): Promise<void> {
  const tab = await getActiveTab()
  if (!tab?.url || !isHttpUrl(tab.url)) {
    activePage = {
      canControl: false,
      isPrivate: false,
      stoppedOnPage: false,
      stoppedOnSite: false,
    }
    render()
    return
  }

  const url = new URL(tab.url)
  let isPrivate = false
  if (tab.id != null) {
    try {
      const result: unknown = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_STATUS',
      } satisfies MurmurMessage)
      isPrivate = isContentPageStatus(result) && result.isPrivate
    } catch {
      // Restricted pages may not have a content script. Their controls stay disabled.
    }
  }

  activePage = {
    canControl: true,
    isPrivate,
    stoppedOnPage: cache.settings.stoppedPages.includes(pageKeyFromUrl(url.href)),
    stoppedOnSite: cache.settings.stoppedDomains.includes(url.hostname),
  }
  render()
}

function patchSettings(patch: Partial<MurmurSettings>): void {
  const revision = ++settingsRevision
  cache = { ...cache, settings: { ...cache.settings, ...patch } }
  render()

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
        render()
        await refreshActivePage()
      }
    })
    .catch((error) => {
      console.error('GemMurmur popup: settings write failed', error)
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
    } else {
      cache = stored
      lastAckedSettingsRevision = settingsRevision
    }
    render()
    await refreshActivePage()
  } catch (error) {
    console.warn('GemMurmur popup: storage read failed, using defaults', error)
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
  }

  if (settings != null && !shouldIgnoreStorageSettings()) {
    cache = {
      ...cache,
      settings: { ...DEFAULT_SETTINGS, ...(settings as Partial<MurmurSettings>) },
    }
    lastAckedSettingsRevision = settingsRevision
  }

  scheduleModelRender()
  void refreshActivePage()
}

function sendBackgroundCommand(message: MurmurMessage): void {
  void chrome.runtime.sendMessage(message).catch((error) => {
    console.warn('GemMurmur popup: background command failed', message.type, error)
  })
}

function markModelPending(): void {
  modelRequestPending = true
  cache = {
    ...cache,
    model: { ...cache.model, status: 'downloading', progress: 0, errorMessage: null },
  }
  render()
}

async function currentPageTarget(): Promise<{ pageKey: string; domain: string } | null> {
  const tab = await getActiveTab()
  if (!tab?.url || !isHttpUrl(tab.url)) return null
  const url = new URL(tab.url)
  return { pageKey: pageKeyFromUrl(url.href), domain: url.hostname }
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
    void currentPageTarget().then((target) => {
      if (!target) return
      patchSettings({
        stoppedPages: Array.from(new Set([...cache.settings.stoppedPages, target.pageKey])),
      })
    })
  })

  stopSiteEl.addEventListener('click', () => {
    void currentPageTarget().then((target) => {
      if (!target) return
      patchSettings({
        stoppedDomains: Array.from(new Set([...cache.settings.stoppedDomains, target.domain])),
      })
    })
  })

  resumeEl.addEventListener('click', () => {
    void currentPageTarget().then((target) => {
      if (!target) return
      patchSettings({
        stoppedPages: cache.settings.stoppedPages.filter((page) => page !== target.pageKey),
        stoppedDomains: cache.settings.stoppedDomains.filter((domain) => domain !== target.domain),
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

  buzzModeEl.addEventListener('click', () => {
    patchSettings({ buzzMode: !cache.settings.buzzMode })
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
  statusDotEl = requireElement('status-dot')
  statusLabelEl = requireElement('status-label')
  modelStatusEl = requireElement('model-status')
  modelProgressEl = requireElement('model-progress')
  modelProgressWrapEl = requireElement('model-progress-wrap')
  modelProgressStageEl = requireElement('model-progress-stage')
  modelProgressValueEl = requireElement('model-progress-value')
  modelProgressTrackEl = requireElement('model-progress-track')
  modelProgressBarEl = requireElement('model-progress-bar')
  modelLoadEl = requireElement('model-load')
  modelReloadEl = requireElement('model-reload')
  modelDeleteEl = requireElement('model-delete')
  modelCancelEl = requireElement('model-cancel')
  buzzModeEl = requireElement('buzz-mode')
  versionEl = requireElement('app-version')
  localizeStaticCopy()
  versionEl.textContent = `v${chrome.runtime.getManifest().version}`

  render()
  bindControls()
  void syncFromStorage()
}

try {
  initPopup()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('GemMurmur popup init failed:', error)
  showInitError(`設定画面の初期化に失敗しました: ${message}`)
}
