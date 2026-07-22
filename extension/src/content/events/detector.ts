import { INTERACTION } from '@/shared/constants'
import type { InteractionEventType } from '@/shared/types'

type Handler = (event: InteractionEventType) => void

export class InteractionDetector {
  private onEvent: Handler
  private lastScrollY = window.scrollY
  private lastScrollAt = performance.now()
  private lastEventAt = new Map<InteractionEventType, number>()
  private regionPasses: Array<{ y: number; at: number }> = []
  private clickTimes: number[] = []
  private lastActivityAt = Date.now()
  private idleTimer: number | null = null
  private hiddenAt: number | null = null
  private disposed = false
  private lastMouseX = 0
  private lastMouseY = 0
  private lastMouseAt = 0
  private mouseDirChanges: Array<{ sign: number; at: number }> = []
  private scrollSamples: Array<{ y: number; at: number }> = []
  private readonly usesPointerEvents = 'PointerEvent' in window

  constructor(onEvent: Handler) {
    this.onEvent = onEvent
    this.bind()
    this.armIdle()
  }

  private emit(
    event: InteractionEventType,
    cooldownMs: number = INTERACTION.sameEventCooldownMs,
  ): void {
    const now = Date.now()
    const last = this.lastEventAt.get(event) ?? 0
    if (now - last < cooldownMs) return
    this.lastEventAt.set(event, now)
    this.onEvent(event)
  }

  private markActivity(): void {
    this.lastActivityAt = Date.now()
    this.armIdle()
  }

  private armIdle(): void {
    if (this.idleTimer != null) window.clearTimeout(this.idleTimer)
    this.idleTimer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') this.emit('idle')
      this.armIdle()
    }, INTERACTION.idleMs)
  }

  private bind(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('click', this.onClick, true)
    if (this.usesPointerEvents) {
      window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    } else {
      window.addEventListener('mousemove', this.onMouseMove, { passive: true })
    }
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('pagehide', this.onNavigate)
  }

  private onMouseMove = (event: MouseEvent): void => {
    this.trackPointer(event.clientX, event.clientY)
  }

  private onPointerMove = (event: PointerEvent): void => {
    this.trackPointer(event.clientX, event.clientY)
  }

  private trackPointer(x: number, y: number): void {
    if (this.disposed) return
    const now = performance.now()
    // Throttle: mousemove fires very frequently; ~25 samples/sec is plenty.
    if (this.lastMouseAt > 0 && now - this.lastMouseAt < 40) return

    if (this.lastMouseAt > 0) {
      const dt = Math.max(8, now - this.lastMouseAt)
      const dx = x - this.lastMouseX
      const dy = y - this.lastMouseY
      const distance = Math.hypot(dx, dy)
      const speed = distance / dt

      if (
        speed >= INTERACTION.mouseFastPxPerMs &&
        distance >= INTERACTION.mouseFastMinDistancePx
      ) {
        this.emit('mouse_fast', INTERACTION.mouseEventCooldownMs)
      }

      if (Math.abs(dx) >= INTERACTION.mouseShakeMinDeltaPx) {
        const sign = Math.sign(dx)
        const nowMs = Date.now()
        const prev = this.mouseDirChanges[this.mouseDirChanges.length - 1]
        if (!prev || prev.sign !== sign) {
          this.mouseDirChanges.push({ sign, at: nowMs })
        }
        this.mouseDirChanges = this.mouseDirChanges.filter(
          (d) => nowMs - d.at <= INTERACTION.mouseShakeWindowMs,
        )
        if (this.mouseDirChanges.length >= INTERACTION.mouseShakeReversals) {
          this.mouseDirChanges = []
          this.emit('mouse_shake', INTERACTION.mouseEventCooldownMs)
        }
      }
    }

    this.lastMouseX = x
    this.lastMouseY = y
    this.lastMouseAt = now
    this.markActivity()
  }

  private onScroll = (): void => {
    if (this.disposed) return
    const now = performance.now()
    const y = window.scrollY

    // Rolling-window speed: per-event dy/dt is too noisy on trackpads.
    this.scrollSamples.push({ y, at: now })
    const windowMs = INTERACTION.fastScrollSampleMs
    this.scrollSamples = this.scrollSamples.filter((s) => now - s.at <= windowMs)
    if (this.scrollSamples.length >= 2) {
      const first = this.scrollSamples[0]
      const last = this.scrollSamples[this.scrollSamples.length - 1]
      const spanMs = Math.max(40, last.at - first.at)
      const distance = Math.abs(last.y - first.y)
      if (distance >= INTERACTION.fastScrollMinDistancePx) {
        const screensPerSec = distance / window.innerHeight / (spanMs / 1000)
        if (screensPerSec >= INTERACTION.fastScrollScreensPerSec) {
          this.emit('fast_scroll', INTERACTION.fastScrollCooldownMs)
        }
      }
    }

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    if (y <= 8) this.emit('top')
    if (y >= maxScroll - 8) this.emit('bottom')

    const region = Math.round(y / Math.max(120, window.innerHeight * 0.35))
    const nowMs = Date.now()
    this.regionPasses.push({ y: region, at: nowMs })
    this.regionPasses = this.regionPasses.filter((p) => nowMs - p.at <= INTERACTION.oscillateWindowMs)
    const hits = this.regionPasses.filter((p) => p.y === region).length
    if (hits >= INTERACTION.oscillatePasses) this.emit('oscillate')

    this.lastScrollY = y
    this.lastScrollAt = now
    this.markActivity()
  }

  private onClick = (): void => {
    const now = Date.now()
    this.clickTimes.push(now)
    this.clickTimes = this.clickTimes.filter((t) => now - t <= INTERACTION.rapidClickWindowMs)
    if (this.clickTimes.length >= INTERACTION.rapidClickCount) this.emit('rapid_click')
    this.markActivity()
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      this.hiddenAt = Date.now()
      return
    }
    if (this.hiddenAt != null && Date.now() - this.hiddenAt >= INTERACTION.tabReturnAwayMs) {
      this.emit('tab_return')
    }
    this.hiddenAt = null
    this.markActivity()
  }

  private onNavigate = (): void => {
    this.emit('navigate')
  }

  get isInteracting(): boolean {
    return Date.now() - this.lastActivityAt < 15_000
  }

  dispose(): void {
    this.disposed = true
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('click', this.onClick, true)
    if (this.usesPointerEvents) {
      window.removeEventListener('pointermove', this.onPointerMove)
    } else {
      window.removeEventListener('mousemove', this.onMouseMove)
    }
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pagehide', this.onNavigate)
    if (this.idleTimer != null) window.clearTimeout(this.idleTimer)
  }
}
