import type { PageContext } from '@/shared/types'
import { GENERATION } from '@/shared/constants'
import { isExtensionContextValid } from './extension-context'
import { runtime } from './state'

export function requestGemmaComments(
  context: PageContext,
  count = GENERATION.gemmaBatchCap,
): void {
  if (!isExtensionContextValid() || !runtime.allowed) return
  runtime.gemmaRequestStartedAt = performance.now()
  void chrome.runtime
    .sendMessage({ type: 'REQUEST_COMMENTS', count, context })
    .catch(() => {
      // The extension may have been reloaded while this page was open.
    })
}

export function requestGemmaIfReady(): void {
  if (!runtime.modelReady || !runtime.pageContext) return
  requestGemmaComments(runtime.pageContext)
}
