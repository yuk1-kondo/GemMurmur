import { FEATURES, GENERATION, QUEUE } from '@/shared/constants'
import { pageKeyFromUrl } from '@/shared/page-key'
import { recordMetric } from '@/shared/metrics'
import { isExtensionContextValid } from './extension-context'
import { requestGemmaComments } from './gemma-client'
import { refillAmbientComments, refillBuzzComments } from './rule-feed'
import { runtime } from './state'

export function pageKey(url = location.href): string {
  return pageKeyFromUrl(url)
}

export function clearSpawnLoop(): void {
  if (runtime.spawnTimer != null) {
    window.clearTimeout(runtime.spawnTimer)
    runtime.spawnTimer = null
  }
}

export function requestRefillIfNeeded(): void {
  if (!isExtensionContextValid() || !runtime.pageContext) return

  if (runtime.density === 'buzz') {
    // Static crowd chants guarantee visual coverage; Gemma independently adds
    // a much larger local-slang batch whenever it is ready.
    if ((runtime.buffer?.size() ?? 0) < Math.floor(QUEUE.maxBuffer * 0.72)) {
      refillBuzzComments(runtime.language, Math.floor(QUEUE.maxBuffer * 0.34))
    }
    if (!runtime.modelReady) return
    const now = Date.now()
    if (now - runtime.lastGemmaRequestAt < GENERATION.buzzRefillMinGapMs) return
    runtime.lastGemmaRequestAt = now
    requestGemmaComments(runtime.pageContext, GENERATION.buzzBatchCap)
    return
  }

  const needsRefill = runtime.buffer?.needsRefill() ?? false
  if (!runtime.modelReady) {
    if (FEATURES.gemmaOnlyComments) return
    if (!needsRefill) return
    refillAmbientComments(runtime.language, true)
    return
  }

  if (!needsRefill) return
  const now = Date.now()
  if (now - runtime.lastGemmaRequestAt < GENERATION.gemmaRefillMinGapMs) return
  runtime.lastGemmaRequestAt = now
  requestGemmaComments(runtime.pageContext)
}

function takeNextComment(): ReturnType<NonNullable<typeof runtime.buffer>['shift']> {
  if (!runtime.buffer) return null
  let next = runtime.buffer.shift()
  while (
    next &&
    FEATURES.gemmaOnlyComments &&
    next.source !== 'gemma' &&
    next.source !== 'interaction'
  ) {
    next = runtime.buffer.shift()
  }
  return next
}

function presentComment(next: NonNullable<ReturnType<typeof takeNextComment>>): void {
  if (!runtime.renderer) return
  runtime.renderer.enqueue(next)
  if (runtime.gemmaRequestStartedAt > 0 && next.source === 'gemma') {
    recordMetric('gemma_first_comment_latency_ms', performance.now() - runtime.gemmaRequestStartedAt)
    runtime.gemmaRequestStartedAt = 0
  }
}

export function armSpawnLoop(): void {
  clearSpawnLoop()
  const tick = (): void => {
    if (!isExtensionContextValid()) {
      clearSpawnLoop()
      return
    }
    if (!runtime.allowed || !runtime.renderer || !runtime.buffer) return

    const burst = runtime.buffer.burstCount()
    const first = takeNextComment()
    if (!first) {
      if (runtime.buffer.needsRefill()) recordMetric('buffer_underrun_rate', 1)
      requestRefillIfNeeded()
      runtime.spawnTimer = window.setTimeout(tick, runtime.buffer.nextSpawnDelayMs())
      return
    }

    presentComment(first)

    // Stagger the rest of a burst instead of dumping them on the same frame.
    let chainDelay = 0
    for (let i = 1; i < burst; i += 1) {
      const next = takeNextComment()
      if (!next) break
      chainDelay += runtime.buffer.burstStaggerMs()
      window.setTimeout(() => {
        if (!isExtensionContextValid() || !runtime.allowed || !runtime.renderer) return
        presentComment(next)
      }, chainDelay)
    }

    requestRefillIfNeeded()
    // Wait for the staggered burst to finish, then add the usual random gap.
    runtime.spawnTimer = window.setTimeout(
      tick,
      chainDelay + runtime.buffer.nextSpawnDelayMs(),
    )
  }
  runtime.spawnTimer = window.setTimeout(
    tick,
    Math.round(runtime.buffer!.spawnIntervalMs() * (0.2 + Math.random() * 0.9)),
  )
}
