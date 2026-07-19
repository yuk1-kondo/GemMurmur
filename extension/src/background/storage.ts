import { STORAGE_KEYS } from '@/shared/constants'
import {
  DEFAULT_BUZZ,
  DEFAULT_MODEL,
  DEFAULT_SETTINGS,
  type BuzzState,
  type ModelState,
  type MurmurSettings,
} from '@/shared/types'

export async function loadSettings(): Promise<MurmurSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings)
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] as Partial<MurmurSettings> | undefined) }
}

export async function saveSettings(settings: MurmurSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings })
}

export async function loadBuzz(): Promise<BuzzState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.buzz)
  return { ...DEFAULT_BUZZ, ...(result[STORAGE_KEYS.buzz] as Partial<BuzzState> | undefined) }
}

export async function saveBuzz(buzz: BuzzState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.buzz]: buzz })
}

export async function loadModel(): Promise<ModelState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.model)
  return { ...DEFAULT_MODEL, ...(result[STORAGE_KEYS.model] as Partial<ModelState> | undefined) }
}

export async function saveModel(model: ModelState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.model]: model })
}
