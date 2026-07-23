import type { DemoTrigger } from '@/shared/messages'
import { QUEUE, STORAGE_KEYS } from '@/shared/constants'
import { createBuzzFloodBatch, createInteractionComment } from '@/shared/rule-comments/factory'
import { USER_MESSAGES } from '@/shared/user-messages'
import { requestGemmaIfReady } from './gemma-client'
import { armSpawnLoop } from './spawn-loop'
import { runtime } from './state'

const activeDemos = new Set<DemoTrigger>()
const timers = new Map<DemoTrigger, number>()

async function persistDemoState(): Promise<void> {
  const map: Record<string, boolean> = {}
  for (const kind of activeDemos) map[kind] = true
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.demo]: map })
  } catch {
    // ignore
  }
}

function clearKindTimer(kind: DemoTrigger): void {
  const id = timers.get(kind)
  if (id != null) window.clearInterval(id)
  timers.delete(kind)
}

function clearOnScreenComments(): void {
  runtime.buffer?.clear()
  runtime.renderer?.clearComments()
}

function setBuzzDensity(on: boolean): void {
  const density = on ? 'buzz' : 'normal'
  runtime.density = density
  runtime.buffer?.setDensity(density)
  runtime.renderer?.setDensity(density)
  if (runtime.spawnTimer != null) armSpawnLoop()
}

function floodBuzzBatch(count = Math.min(10, QUEUE.maxBuffer)): void {
  if (!activeDemos.has('force_buzz') || !runtime.buffer) return
  runtime.buffer.push(createBuzzFloodBatch(runtime.language, count))
}

function startBuzz(): void {
  setBuzzDensity(true)
  floodBuzzBatch(QUEUE.maxBuffer)
  requestGemmaIfReady()
  clearKindTimer('force_buzz')
  timers.set(
    'force_buzz',
    window.setInterval(() => {
      if (!activeDemos.has('force_buzz') || !runtime.buffer) return
      if (runtime.buffer.size() < QUEUE.minBuffer) floodBuzzBatch(8)
      else floodBuzzBatch(3)
      requestGemmaIfReady()
    }, 1_400),
  )
}

function stopBuzz(): void {
  clearKindTimer('force_buzz')
  setBuzzDensity(false)
  clearOnScreenComments()
}

function startInteractionDemo(kind: 'force_fast_scroll' | 'force_idle'): void {
  const event = kind === 'force_fast_scroll' ? 'fast_scroll' : 'idle'
  const push = (): void => {
    if (!activeDemos.has(kind) || !runtime.buffer) return
    runtime.buffer.pushFront(createInteractionComment(runtime.language, event))
  }
  push()
  clearKindTimer(kind)
  timers.set(kind, window.setInterval(push, 2_800))
}

function stopInteractionDemo(kind: 'force_fast_scroll' | 'force_idle'): void {
  clearKindTimer(kind)
  // Only wipe the stream if no other interaction/seed/buzz demo is still on.
  if (
    !activeDemos.has('force_fast_scroll') &&
    !activeDemos.has('force_idle') &&
    !activeDemos.has('force_buzz') &&
    !activeDemos.has('seed_first_comment')
  ) {
    clearOnScreenComments()
  }
}

function startSeedDemo(): void {
  requestGemmaIfReady()
  clearKindTimer('seed_first_comment')
  timers.set(
    'seed_first_comment',
    window.setInterval(() => {
      if (!activeDemos.has('seed_first_comment')) return
      requestGemmaIfReady()
    }, 6_000),
  )
}

function stopSeedDemo(): void {
  clearKindTimer('seed_first_comment')
  if (
    !activeDemos.has('force_buzz') &&
    !activeDemos.has('force_fast_scroll') &&
    !activeDemos.has('force_idle')
  ) {
    clearOnScreenComments()
  }
}

function startErrorDemo(kind: DemoTrigger): void {
  if (!runtime.renderer) return
  for (const other of [
    'force_error_webgpu',
    'force_error_model',
    'force_error_memory',
  ] as const) {
    if (other !== kind) activeDemos.delete(other)
  }
  const message =
    kind === 'force_error_webgpu'
      ? USER_MESSAGES.webgpuUnsupported
      : kind === 'force_error_model'
        ? USER_MESSAGES.modelLoadFailed
        : USER_MESSAGES.memoryError
  runtime.renderer.showStatus(message, 'error', 'center', { persist: true })
}

function stopErrorDemo(): void {
  runtime.renderer?.clearStatus()
}

/** Apply a demo toggle from the popup (active=true starts, false stops). */
export function applyDemoToggle(kind: DemoTrigger, active: boolean): void {
  if (!runtime.renderer && !runtime.buffer) return

  if (!active) {
    if (!activeDemos.has(kind)) return
    activeDemos.delete(kind)
    switch (kind) {
      case 'force_buzz':
        stopBuzz()
        break
      case 'force_fast_scroll':
      case 'force_idle':
        stopInteractionDemo(kind)
        break
      case 'seed_first_comment':
        stopSeedDemo()
        break
      case 'force_error_webgpu':
      case 'force_error_model':
      case 'force_error_memory':
        stopErrorDemo()
        break
    }
    void persistDemoState()
    return
  }

  activeDemos.add(kind)
  switch (kind) {
    case 'force_buzz':
      startBuzz()
      break
    case 'force_fast_scroll':
    case 'force_idle':
      startInteractionDemo(kind)
      break
    case 'seed_first_comment':
      startSeedDemo()
      break
    case 'force_error_webgpu':
    case 'force_error_model':
    case 'force_error_memory':
      startErrorDemo(kind)
      break
  }
  void persistDemoState()
}

export function isDemoBuzzActive(): boolean {
  return activeDemos.has('force_buzz')
}

/** Tear down all demo loops (page navigation / hard stop). */
export function clearAllDemoToggles(): void {
  for (const kind of [...timers.keys()]) clearKindTimer(kind)
  activeDemos.clear()
  void persistDemoState()
}
