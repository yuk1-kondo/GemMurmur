import { DISPLAY, FEATURES, GENERATION } from '@/shared/constants'
import { resolveLanguage } from '@/shared/language'
import type { RuntimeState } from '@/shared/messages'
import { pageKeyFromUrl } from '@/shared/page-key'
import { patchSettingsInStorage, readRuntimeStateFromStorage } from '@/shared/runtime-storage'
import { isHardStopped } from '@/shared/runtime-guards'
import { USER_MESSAGES } from '@/shared/user-messages'
import { InteractionDetector } from '../events/detector'
import { extractPageContext, isScrollIdle } from '../extract/dom'
import { mountOverlayControls } from '../overlay/controls'
import { ensureOverlayRoot, removeOverlayRoot } from '../overlay/root'
import { LocalCommentBuffer } from '../queue/local-buffer'
import { CommentRenderer } from '../renderer/engine'
import { isExtensionContextValid } from './extension-context'
import { requestGemmaComments } from './gemma-client'
import {
  refillAmbientComments,
  seedBootComments,
  showInteractionComment,
} from './rule-feed'
import { clearAllDemoToggles } from './demo-toggles'
import { armSpawnLoop, clearSpawnLoop, pageKey } from './spawn-loop'
import { runtime } from './state'

export function showModelWaitStatus(state: RuntimeState): void {
  if (!runtime.renderer) return
  const model = state.model
  if (model.status === 'ready') {
    runtime.renderer.clearStatus()
    return
  }
  if (model.status === 'unsupported') {
    runtime.renderer.showStatus(USER_MESSAGES.webgpuUnsupported, 'error')
    return
  }
  if (model.status === 'downloading' || model.status === 'loading') {
    runtime.renderer.showStatus(USER_MESSAGES.modelLoading, 'info', 'corner')
    return
  }
  runtime.renderer.showStatus(USER_MESSAGES.modelPending, 'info', 'corner')
}

export function clearTimers(): void {
  clearSpawnLoop()
  if (runtime.ambientTimer != null) window.clearInterval(runtime.ambientTimer)
  if (runtime.activityTimer != null) window.clearInterval(runtime.activityTimer)
  if (runtime.contextTimer != null) window.clearInterval(runtime.contextTimer)
  runtime.ambientTimer = runtime.activityTimer = runtime.contextTimer = null
}

export function stopRuntime(message?: string, level: 'info' | 'error' = 'info'): void {
  runtime.allowed = false
  runtime.paused = false
  clearAllDemoToggles()
  runtime.detector?.dispose()
  runtime.detector = null
  clearTimers()
  runtime.buffer?.clear()
  runtime.renderer?.destroy()
  runtime.unmountControls?.()
  runtime.unmountControls = null
  if (message) {
    ensureOverlayRoot()
    runtime.renderer = new CommentRenderer()
    runtime.renderer.showStatus(message, level)
    return
  }
  removeOverlayRoot()
  runtime.renderer = null
}

/** Toggle pause/resume. The overlay control button stays visible either way. */
export async function handleOverlayToggle(): Promise<void> {
  if (!isExtensionContextValid()) return
  const paused = runtime.settings?.paused ?? false
  try {
    await patchSettingsInStorage({ paused: !paused })
  } catch {
    // ignore — storage change is picked up by the content storage sync listener
  }
}

/** Mount (or re-mount) the single pause/resume control button. */
export function mountControls(paused: boolean): void {
  runtime.unmountControls?.()
  runtime.unmountControls = mountOverlayControls(
    ensureOverlayRoot(),
    runtime.language,
    paused,
    () => {
      void handleOverlayToggle()
    },
  )
}

/**
 * Paused state: stop the comment stream but keep the overlay + resume button.
 * Distinct from `stopRuntime`, which tears the overlay down entirely.
 */
export function enterPausedState(): void {
  runtime.paused = true
  runtime.allowed = false
  clearTimers()
  runtime.detector?.dispose()
  runtime.detector = null
  runtime.buffer?.clear()
  ensureOverlayRoot()
  if (!runtime.renderer) runtime.renderer = new CommentRenderer()
  runtime.renderer.destroy()
  runtime.renderer.clearStatus()
  mountControls(true)
}

export function installNavigationWatcher(onNavigate: () => void): void {
  if (runtime.navigationHooked) return
  runtime.navigationHooked = true

  window.addEventListener('popstate', onNavigate)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) onNavigate()
  })

  const wrapHistory = <T extends History['pushState']>(original: T): T =>
    function (this: History, ...args: Parameters<T>) {
      const result = original.apply(this, args)
      onNavigate()
      return result
    } as T

  history.pushState = wrapHistory(history.pushState)
  history.replaceState = wrapHistory(history.replaceState)
}

export async function handlePageNavigation(): Promise<void> {
  if (!isExtensionContextValid()) return
  const key = pageKey()
  if (key === runtime.currentPageKey) return
  runtime.currentPageKey = key

  const state = await readRuntimeStateFromStorage()
  runtime.modelReady = state.model.status === 'ready'
  clearAllDemoToggles()
  clearTimers()
  runtime.allowed = false
  runtime.detector?.dispose()
  runtime.detector = null
  runtime.buffer?.clear()
  runtime.lastGemmaRequestAt = 0
  runtime.gemmaRequestStartedAt = 0
  runtime.renderer?.destroy()
  runtime.renderer = null
  runtime.unmountControls?.()
  runtime.unmountControls = null

  startRuntime(state)
}

function armAmbientLoop(modelPending: boolean): void {
  if (FEATURES.gemmaOnlyComments) return
  if (runtime.ambientTimer != null) window.clearInterval(runtime.ambientTimer)
  const interval = modelPending ? DISPLAY.modelWaitAmbientIntervalMs : DISPLAY.ambientIntervalMs
  runtime.ambientTimer = window.setInterval(() => {
    if (!isExtensionContextValid() || !runtime.allowed) return
    if (runtime.buffer && !runtime.buffer.needsRefill()) return
    refillAmbientComments(runtime.language, modelPending && !runtime.modelReady)
  }, interval)
}

export function refreshAmbientLoop(): void {
  if (FEATURES.gemmaOnlyComments) return
  if (!runtime.allowed) return
  armAmbientLoop(!runtime.modelReady)
}

export function startRuntime(state: RuntimeState): void {
  if (!runtime.buffer) runtime.buffer = new LocalCommentBuffer()

  const ctx = extractPageContext()
  runtime.currentPageKey = pageKey(ctx.url)
  runtime.pageContext = ctx
  runtime.language = resolveLanguage(state.settings.language, ctx.language)
  runtime.settings = state.settings
  runtime.density = state.buzz.density
  runtime.modelReady = state.model.status === 'ready'

  if (ctx.isPrivate) {
    runtime.renderer?.destroy()
    ensureOverlayRoot()
    runtime.renderer = new CommentRenderer()
    runtime.renderer.showStatus(USER_MESSAGES.privatePage(runtime.language), 'info')
    return
  }

  if (isHardStopped(state.settings, ctx)) {
    stopRuntime()
    return
  }

  if (state.settings.paused) {
    enterPausedState()
    return
  }

  runtime.paused = false
  runtime.allowed = true
  runtime.renderer?.destroy()
  ensureOverlayRoot()
  runtime.renderer = new CommentRenderer()
  runtime.renderer.setDensity(runtime.density)
  runtime.buffer.setDensity(runtime.density)
  runtime.buffer.clear()

  showModelWaitStatus(state)
  if (!FEATURES.gemmaOnlyComments) {
    seedBootComments(runtime.language, !runtime.modelReady)
  }

  mountControls(false)

  runtime.detector?.dispose()
  runtime.detector = new InteractionDetector((event) => {
    showInteractionComment(event, runtime.language)
  })

  armSpawnLoop()
  armAmbientLoop(!runtime.modelReady)

  if (runtime.activityTimer != null) window.clearInterval(runtime.activityTimer)
  runtime.activityTimer = window.setInterval(() => {
    if (!isExtensionContextValid()) {
      clearTimers()
      return
    }
    void chrome.runtime
      .sendMessage({
        type: 'ACTIVITY_TICK',
        visible: document.visibilityState === 'visible',
        interacting: runtime.detector?.isInteracting ?? false,
      })
      .catch(() => {
        clearTimers()
      })
  }, 5_000)

  if (runtime.contextTimer != null) window.clearInterval(runtime.contextTimer)
  runtime.contextTimer = window.setInterval(() => {
    if (!isExtensionContextValid()) {
      clearTimers()
      return
    }
    if (!runtime.allowed) return
    if (pageKey() !== runtime.currentPageKey) {
      void handlePageNavigation()
      return
    }
    if (!isScrollIdle()) return
    runtime.pageContext = extractPageContext()
    runtime.language = resolveLanguage(runtime.settings?.language ?? 'auto', runtime.pageContext.language)
  }, GENERATION.contextRefreshMs)

  if (runtime.modelReady) {
    requestGemmaComments(ctx)
  }
}

export async function bootstrap(): Promise<void> {
  if (!runtime.buffer) runtime.buffer = new LocalCommentBuffer()
  installNavigationWatcher(() => {
    void handlePageNavigation()
  })
  const state = await readRuntimeStateFromStorage()
  runtime.modelReady = state.model.status === 'ready'
  runtime.currentPageKey = pageKeyFromUrl(location.href)
  startRuntime(state)
}
