import { STORAGE_KEYS } from '@/shared/constants'
import { DEFAULT_SETTINGS, type MurmurSettings } from '@/shared/types'
import type { AppState } from './handlers/messages'

function mergeSettings(stored: unknown): MurmurSettings {
  if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) {
    return DEFAULT_SETTINGS
  }
  return { ...DEFAULT_SETTINGS, ...(stored as Partial<MurmurSettings>) }
}

/**
 * Popup writes settings directly to chrome.storage.local.
 * Content scripts observe the same storage change themselves, so this only
 * keeps the service worker's in-memory settings current.
 */
export function installSettingsStorageSync(app: AppState): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    const change = changes[STORAGE_KEYS.settings]
    if (!change) return

    app.settings = mergeSettings(change.newValue)
  })
}
