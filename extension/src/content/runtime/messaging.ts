import { FEATURES } from '@/shared/constants'
import type { MurmurMessage } from '@/shared/messages'
import { pageKeyFromUrl } from '@/shared/page-key'
import { isStopped } from '@/shared/runtime-guards'
import { USER_MESSAGES } from '@/shared/user-messages'
import { isExtensionContextValid } from './extension-context'
import { requestGemmaIfReady } from './gemma-client'
import { onDensityChange, showThinkingMurmurs } from './rule-feed'
import { applyDemoToggle, isDemoBuzzActive } from './demo-toggles'
import { armSpawnLoop } from './spawn-loop'
import { refreshAmbientLoop, startRuntime, stopRuntime } from './lifecycle'
import { runtime } from './state'

export function installMessageListener(): void {
  chrome.runtime.onMessage.addListener((message: MurmurMessage) => {
    if (!isExtensionContextValid()) return
    if (message.type === 'STATE') {
      const wasAllowed = runtime.allowed
      runtime.settings = message.payload.settings
      runtime.density = message.payload.buzz.density
      runtime.modelReady = message.payload.model.status === 'ready'
      runtime.buffer?.setDensity(runtime.density)
      runtime.renderer?.setDensity(runtime.density)
      if (!wasAllowed) startRuntime(message.payload)
      else if (runtime.pageContext && isStopped(message.payload.settings, runtime.pageContext)) {
        stopRuntime()
      }
      return
    }

    if (message.type === 'COMMENTS') {
      if (message.pageKey !== pageKeyFromUrl(location.href)) return
      const comments = FEATURES.gemmaOnlyComments
        ? message.comments.filter((c) => c.source === 'gemma')
        : message.comments
      if (comments.length > 0) runtime.buffer?.push(comments)
      return
    }

    if (message.type === 'DENSITY') {
      // Demo buzz toggle owns density while active.
      if (isDemoBuzzActive()) return
      runtime.density = message.density
      runtime.buffer?.setDensity(runtime.density)
      runtime.renderer?.setDensity(runtime.density)
      if (runtime.spawnTimer != null) armSpawnLoop()
      onDensityChange(runtime.density, runtime.language)
      if (runtime.density === 'buzz') requestGemmaIfReady()
      return
    }

    if (message.type === 'SHOW_STATUS') {
      // Gemma thinking → scroll as comments (nicer than a corner badge).
      if (message.message === USER_MESSAGES.gemmaThinking) {
        showThinkingMurmurs(runtime.language)
        return
      }
      runtime.renderer?.showStatus(message.message, message.level, message.placement)
      return
    }

    if (message.type === 'CLEAR_STATUS') {
      // Thinking murmurs are real comments; nothing corner-specific to clear.
      runtime.renderer?.clearStatus()
      return
    }

    if (message.type === 'MODEL_STATUS') {
      const wasReady = runtime.modelReady
      runtime.modelReady = message.model.status === 'ready'
      if (message.model.status === 'unsupported') {
        stopRuntime(USER_MESSAGES.webgpuUnsupported, 'error')
        return
      }
      if (runtime.modelReady && !wasReady) {
        refreshAmbientLoop()
        requestGemmaIfReady()
      }
      return
    }

    if (message.type === 'DEMO_TRIGGER') {
      applyDemoToggle(message.kind, message.active)
    }
  })
}
