import { STORAGE_KEYS } from '@/shared/constants'
import { resolveLanguage } from '@/shared/language'
import { readRuntimeStateFromStorage } from '@/shared/runtime-storage'
import { isHardStopped } from '@/shared/runtime-guards'
import { extractPageContext } from '../extract/dom'
import { isExtensionContextValid } from './extension-context'
import { requestGemmaIfReady } from './gemma-client'
import { applyDemoToggle } from './demo-toggles'
import {
  enterPausedState,
  mountControls,
  showModelWaitStatus,
  startRuntime,
  stopRuntime,
} from './lifecycle'
import { runtime } from './state'

function applyRuntimeState(): void {
  if (!isExtensionContextValid()) return
  void readRuntimeStateFromStorage()
    .then((state) => {
      if (!isExtensionContextValid()) return
      const prevReady = runtime.modelReady
      const wasBuzzMode = runtime.settings?.buzzMode ?? false
      runtime.modelReady = state.model.status === 'ready'
      runtime.settings = state.settings
      runtime.density = state.buzz.density

      const ctx = runtime.pageContext ?? extractPageContext()
      runtime.pageContext = ctx
      const prevLanguage = runtime.language
      runtime.language = resolveLanguage(state.settings.language, ctx.language)
      const languageChanged = runtime.language !== prevLanguage

      if (ctx.isPrivate) return

      if (isHardStopped(state.settings, ctx)) {
        if (runtime.allowed || runtime.paused) stopRuntime()
        return
      }

      if (state.settings.paused) {
        if (runtime.paused) mountControls(true)
        else enterPausedState()
        return
      }

      if (!runtime.allowed) {
        startRuntime(state)
        return
      }

      if (state.settings.buzzMode !== wasBuzzMode) {
        applyDemoToggle('force_buzz', state.settings.buzzMode)
      }

      runtime.buffer?.setDensity(runtime.density)
      runtime.renderer?.setDensity(runtime.density)

      if (runtime.renderer) {
        showModelWaitStatus(state)
      }

      if (languageChanged) {
        // Re-render and regenerate in the newly selected language.
        runtime.buffer?.clear()
        runtime.lastGemmaRequestAt = 0
        mountControls(false)
        requestGemmaIfReady()
      } else if (runtime.modelReady && !prevReady) {
        requestGemmaIfReady()
      }
    })
    .catch(() => {
      // A refreshed page receives a new, valid extension context.
    })
}

/** Content tabs react to popup/settings changes without waiting on the service worker. */
export function installContentStorageSync(): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (!isExtensionContextValid()) return
    if (area !== 'local') return
    if (
      !changes[STORAGE_KEYS.settings] &&
      !changes[STORAGE_KEYS.buzz] &&
      !changes[STORAGE_KEYS.model]
    ) {
      return
    }
    applyRuntimeState()
  })
}
