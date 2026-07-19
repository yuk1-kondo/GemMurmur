import { DISPLAY } from '@/shared/constants'
import type { DensityMode } from '@/shared/types'

interface LaneState {
  freeAt: number
}

/**
 * Pick vertical lanes with spacing that scales to the viewport.
 * Browser windows are often much taller/wider than nico-douga, so packing
 * as tightly as a 480p player makes comments unreadable.
 */
export class LaneManager {
  private lanes: LaneState[] = []
  private density: DensityMode = 'normal'

  setDensity(density: DensityMode): void {
    this.density = density
    const count = this.laneCount()
    while (this.lanes.length < count) this.lanes.push({ freeAt: 0 })
    if (this.lanes.length > count) this.lanes.length = count
  }

  private laneCount(): number {
    const height = typeof window !== 'undefined' ? window.innerHeight : 900
    // Minimum vertical gap between lane centers (px). Wider gap = less overlap.
    const minGapPx =
      this.density === 'buzz' ? 30 : this.density === 'busy' ? 40 : 48
    const usablePx = height * 0.76
    const byHeight = Math.max(5, Math.floor(usablePx / minGapPx))
    const cap =
      this.density === 'buzz'
        ? DISPLAY.buzzLaneCount
        : this.density === 'busy'
          ? DISPLAY.busyLaneCount
          : DISPLAY.normalLaneCount
    return Math.min(cap, byHeight)
  }

  private collisionSlack(): number {
    // Prefer free lanes; higher slack = less same-lane stacking.
    if (this.density === 'buzz') return 280
    if (this.density === 'busy') return 900
    return 1_600
  }

  pickLane(now: number, durationMs: number): number {
    if (this.lanes.length === 0) this.setDensity(this.density)

    let bestIndex = 0
    let bestFree = Number.POSITIVE_INFINITY
    const slack = this.collisionSlack()

    for (let i = 0; i < this.lanes.length; i += 1) {
      const freeAt = this.lanes[i].freeAt
      if (freeAt <= now + (this.density === 'normal' ? 0 : slack * 0.15)) {
        bestIndex = i
        bestFree = freeAt
        break
      }
      if (freeAt < bestFree) {
        bestFree = freeAt
        bestIndex = i
      }
    }

    // Light jitter only — large jumps cause adjacent-lane collisions.
    const jitter =
      this.density === 'buzz' && Math.random() < 0.2
        ? Math.floor(Math.random() * 2)
        : 0
    const lane = Math.min(this.lanes.length - 1, bestIndex + jitter)
    // Hold the lane until the previous comment has mostly left the screen.
    const occupyFrac =
      this.density === 'buzz' ? 0.52 : this.density === 'busy' ? 0.7 : 0.84
    const occupyUntil = now + durationMs * occupyFrac
    this.lanes[lane].freeAt = Math.max(this.lanes[lane].freeAt, occupyUntil)
    return lane
  }

  laneTopPercent(lane: number): number {
    const count = Math.max(1, this.lanes.length)
    const usable = 76
    const start = 8
    if (count === 1) return start + usable / 2
    return start + (usable * lane) / (count - 1)
  }
}
