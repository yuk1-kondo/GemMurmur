import { STORAGE_KEYS } from './constants'
import type { RuntimeState } from './messages'
import {
  DEFAULT_BUZZ,
  DEFAULT_MODEL,
  DEFAULT_SETTINGS,
  type MurmurSettings,
} from './types'

function mergeStored<T extends object>(defaults: T, stored: unknown): T {
  if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) {
    return defaults
  }
  return { ...defaults, ...(stored as Partial<T>) }
}

/** Read extension state from chrome.storage — never blocks on the service worker. */
export async function readRuntimeStateFromStorage(): Promise<RuntimeState> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.settings,
    STORAGE_KEYS.buzz,
    STORAGE_KEYS.model,
  ])
  return {
    settings: mergeStored(DEFAULT_SETTINGS, result[STORAGE_KEYS.settings]),
    buzz: mergeStored(DEFAULT_BUZZ, result[STORAGE_KEYS.buzz]),
    model: mergeStored(DEFAULT_MODEL, result[STORAGE_KEYS.model]),
  }
}

export async function patchSettingsInStorage(
  patch: Partial<MurmurSettings>,
): Promise<MurmurSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings)
  const current = mergeStored(DEFAULT_SETTINGS, result[STORAGE_KEYS.settings])
  const next = { ...current, ...patch }
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: next })
  return next
}

export function isRuntimeState(value: unknown): value is RuntimeState {
  return (
    value != null &&
    typeof value === 'object' &&
    'settings' in value &&
    'model' in value &&
    'buzz' in value
  )
}
