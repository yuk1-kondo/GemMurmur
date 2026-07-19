import { Engine, loadLiteRtLm } from '@litert-lm/core'
import { GENERATION, MODEL } from '@/shared/constants'
import type { MurmurMessage } from '@/shared/messages'

let engine: Engine | null = null
let conversation: Awaited<ReturnType<Engine['createConversation']>> | null = null
let loading: Promise<void> | null = null
let cancelDownload = false
let wasmLoaded = false

/**
 * Load the LiteRT-LM WASM glue from the extension's own origin.
 * MV3 blocks the library's default CDN fetch, so we bundle the WASM locally
 * (see scripts/copy-wasm.mjs) and point the loader at chrome-extension://.../wasm/.
 */
async function ensureWasm(): Promise<void> {
  if (wasmLoaded) return
  try {
    await loadLiteRtLm(chrome.runtime.getURL('wasm/'))
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    // loadLiteRtLm throws if it was already initialized; that is fine.
    if (!/already loading|already loaded/i.test(text)) throw error
  }
  wasmLoaded = true
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object') {
          const row = part as { text?: string; type?: string }
          if (typeof row.text === 'string') return row.text
        }
        return ''
      })
      .join('')
  }
  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text?: string }).text ?? '')
  }
  return ''
}

function reportProgress(progress: number, bytesTotal: number | null): void {
  chrome.runtime.sendMessage({
    type: 'OFFSCREEN_MODEL_PROGRESS',
    progress,
    bytesTotal,
  } satisfies MurmurMessage)
}

function reportError(message: string): void {
  chrome.runtime.sendMessage({
    type: 'OFFSCREEN_MODEL_ERROR',
    message,
  } satisfies MurmurMessage)
}

async function hasWebGpu(): Promise<boolean> {
  if (!('gpu' in navigator) || !navigator.gpu) return false
  try {
    const adapter = await navigator.gpu.requestAdapter()
    return adapter != null
  } catch {
    return false
  }
}

async function cachePut(blob: Blob): Promise<boolean> {
  try {
    const cache = await caches.open(MODEL.cacheName)
    await cache.put(MODEL.url, new Response(blob))
    return true
  } catch (error) {
    console.warn('Model cache write failed:', error)
    return false
  }
}

async function cacheMatch(): Promise<Blob | null> {
  try {
    const cache = await caches.open(MODEL.cacheName)
    const hit = await cache.match(MODEL.url)
    if (!hit) return null
    return hit.blob()
  } catch {
    return null
  }
}

async function cacheDelete(): Promise<void> {
  try {
    const cache = await caches.open(MODEL.cacheName)
    await cache.delete(MODEL.url)
  } catch {
    // ignore
  }
}

async function downloadModel(): Promise<Blob> {
  cancelDownload = false
  reportProgress(0.01, MODEL.approxBytes)

  const response = await fetch(MODEL.url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Model download failed: empty response body')
  }

  const total = Number(response.headers.get('content-length') ?? MODEL.approxBytes)
  const reader = response.body.getReader()
  const chunks: BlobPart[] = []
  let received = 0
  let lastReport = 0

  while (true) {
    if (cancelDownload) throw new Error('Download cancelled')
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    chunks.push(value)
    received += value.byteLength
    const now = Date.now()
    if (now - lastReport > 500) {
      const progress = total > 0 ? Math.min(0.92, received / total) : 0.1
      reportProgress(progress, total || MODEL.approxBytes)
      lastReport = now
    }
  }

  if (received < 1_000_000) {
    throw new Error('Model download failed: response too small (check network permissions)')
  }

  const blob = new Blob(chunks)
  reportProgress(0.93, blob.size)
  await cachePut(blob)
  return blob
}

async function loadEngine(): Promise<void> {
  if (engine) return
  if (!(await hasWebGpu())) {
    throw new Error('WebGPU is not available')
  }

  await ensureWasm()

  let modelSource: Blob | string = MODEL.url
  const cached = await cacheMatch()
  if (cached) {
    modelSource = cached
    reportProgress(0.95, cached.size)
  } else {
    modelSource = await downloadModel()
  }

  reportProgress(0.96, MODEL.approxBytes)
  engine = await Engine.create({
    model: modelSource,
    mainExecutorSettings: {
      maxNumTokens: GENERATION.maxSequenceTokens,
    },
  })

  reportProgress(0.99, MODEL.approxBytes)
}

async function ensureModel(): Promise<void> {
  if (loading) return loading
  loading = (async () => {
    try {
      await loadEngine()
      chrome.runtime.sendMessage({ type: 'OFFSCREEN_MODEL_READY' } satisfies MurmurMessage)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      reportError(message)
      engine = null
    } finally {
      loading = null
    }
  })()
  return loading
}

async function resetConversation(): Promise<void> {
  if (conversation) {
    try {
      await conversation.delete()
    } catch {
      // ignore
    }
    conversation = null
  }
}

async function ensureConversation(): Promise<NonNullable<typeof conversation>> {
  await ensureModel()
  if (!engine) throw new Error('Model not ready')
  if (!conversation) {
    conversation = await engine.createConversation({
      preface: {
        messages: [
          {
            role: 'system',
            content:
              'You write short anonymous live-audience comments for a web page. One comment per line. No JSON. No explanations.',
          },
        ],
      },
    })
  }
  return conversation
}

async function generate(prompt: string): Promise<string> {
  // Each comment batch is independent. Reusing the conversation would let
  // history accumulate past maxNumTokens (causing "token ids are too long")
  // and leak one page's context into the next, so start fresh every time.
  await resetConversation()
  const conv = await ensureConversation()
  const response = await conv.sendMessage(prompt)
  const text = messageText(response.content).trim()
  if (!text) {
    console.warn('GemMurmur offscreen: empty model output', JSON.stringify(response).slice(0, 300))
  }
  return text
}

// Only these messages belong to the offscreen document. Everything else
// (GET_STATE, SET_*, etc.) is owned by the service worker; if we responded to
// them we would win the sendResponse race and break the popup.
const OFFSCREEN_HANDLED = new Set<MurmurMessage['type']>([
  'OFFSCREEN_CHECK_WEBGPU',
  'OFFSCREEN_ENSURE_MODEL',
  'OFFSCREEN_GENERATE',
  'OFFSCREEN_CANCEL_DOWNLOAD',
  'OFFSCREEN_DELETE_MODEL',
])

chrome.runtime.onMessage.addListener((message: MurmurMessage, _sender, sendResponse) => {
  if (!OFFSCREEN_HANDLED.has(message.type)) return false

  const run = async (): Promise<unknown> => {
    switch (message.type) {
      case 'OFFSCREEN_CHECK_WEBGPU':
        return { supported: await hasWebGpu() }
      case 'OFFSCREEN_ENSURE_MODEL':
        await ensureModel()
        return { ok: true }
      case 'OFFSCREEN_GENERATE': {
        try {
          const text = await generate(message.prompt)
          return { text }
        } catch (error) {
          return {
            text: null,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }
      case 'OFFSCREEN_CANCEL_DOWNLOAD':
        cancelDownload = true
        return { ok: true }
      case 'OFFSCREEN_DELETE_MODEL':
        await cacheDelete()
        await resetConversation()
        if (engine) {
          try {
            await engine.delete()
          } catch {
            // ignore
          }
        }
        engine = null
        return { ok: true }
      default:
        return { ok: true }
    }
  }

  void run()
    .then(sendResponse)
    .catch((error) => {
      console.error('GemMurmur offscreen message error:', message.type, error)
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    })
  return true
})

console.info('GemMurmur offscreen ready')
