import type { MurmurMessage } from '@/shared/messages'
import { ensureOffscreenDocument } from './offscreen'

const OFFSCREEN_RPC = new Set<MurmurMessage['type']>([
  'OFFSCREEN_ENSURE_MODEL',
  'OFFSCREEN_GENERATE',
  'OFFSCREEN_CHECK_WEBGPU',
  'OFFSCREEN_CANCEL_DOWNLOAD',
  'OFFSCREEN_DELETE_MODEL',
])

export function isOffscreenRpc(type: MurmurMessage['type']): boolean {
  return OFFSCREEN_RPC.has(type)
}

export async function sendToOffscreen<T extends MurmurMessage>(
  message: T,
): Promise<unknown> {
  await ensureOffscreenDocument()

  const isGenerate = message.type === 'OFFSCREEN_GENERATE'
  const maxAttempts = isGenerate ? 2 : 5
  const retryDelayMs = isGenerate ? 500 : 200

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await chrome.runtime.sendMessage(message)
      if (result !== undefined) return result
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)))
    }
  }

  const messageText =
    lastError instanceof Error ? lastError.message : 'Offscreen document is not responding'
  throw new Error(messageText)
}
