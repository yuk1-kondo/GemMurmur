import { BUZZ } from '@/shared/constants'
import type { BuzzState, DensityMode } from '@/shared/types'

export function tickBuzz(
  buzz: BuzzState,
  opts: { visible: boolean; interacting: boolean; now?: number },
): BuzzState {
  const now = opts.now ?? Date.now()
  const next: BuzzState = { ...buzz }

  if (!opts.visible || !opts.interacting) {
    if (next.lastActiveAt > 0 && now - next.lastActiveAt >= BUZZ.awayResetMs) {
      return {
        activeMs: 0,
        inBuzz: false,
        buzzStartedAt: null,
        lastActiveAt: 0,
        density: 'normal',
      }
    }
    return { ...next, density: densityFor(next) }
  }

  const gap = next.lastActiveAt > 0 ? now - next.lastActiveAt : BUZZ.tickMs
  if (gap <= BUZZ.idleGapMs) {
    next.activeMs += Math.min(gap, BUZZ.tickMs)
  }
  next.lastActiveAt = now

  if (!next.inBuzz && next.activeMs >= BUZZ.startAfterMs) {
    next.inBuzz = true
    next.buzzStartedAt = now
  }

  if (next.inBuzz && next.buzzStartedAt != null) {
    if (now - next.buzzStartedAt >= BUZZ.durationMs) {
      next.inBuzz = false
      next.buzzStartedAt = null
      // After buzz, settle into slightly busy state
      next.activeMs = Math.min(next.activeMs, BUZZ.startAfterMs - 5 * 60_000)
    }
  }

  next.density = densityFor(next)
  return next
}

function densityFor(buzz: BuzzState): DensityMode {
  if (buzz.inBuzz) return 'buzz'
  if (buzz.activeMs >= BUZZ.startAfterMs * 0.5) return 'busy'
  return 'normal'
}

/** Demo helper: jump into buzz immediately */
export function forceBuzz(buzz: BuzzState, now = Date.now()): BuzzState {
  return {
    ...buzz,
    activeMs: BUZZ.startAfterMs,
    inBuzz: true,
    buzzStartedAt: now,
    lastActiveAt: now,
    density: 'buzz',
  }
}

/** Demo helper: leave buzz and return to a calm baseline. */
export function clearBuzz(buzz: BuzzState): BuzzState {
  return {
    ...buzz,
    activeMs: 0,
    inBuzz: false,
    buzzStartedAt: null,
    density: 'normal',
  }
}
