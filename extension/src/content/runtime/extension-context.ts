/**
 * Content scripts survive briefly after an extension reload. During that
 * interval every Chrome extension API call throws "Extension context
 * invalidated", so timers must stop before attempting another call.
 */
export function isExtensionContextValid(): boolean {
  return Boolean(chrome.runtime?.id)
}
