import { DISPLAY, INTERACTION, QUEUE } from '@/shared/constants'
import type { CommentDraft, DensityMode } from '@/shared/types'
import { CommentTextLedger, normalizeCommentKey } from '@/shared/text-dedup'
import { sanitizeCommentText } from '../safety/filter'

export class LocalCommentBuffer {
  private items: CommentDraft[] = []
  private density: DensityMode = 'normal'
  private textLedger = new CommentTextLedger(INTERACTION.sameTextCooldownMs)

  setDensity(density: DensityMode): void {
    this.density = density
  }

  clear(): void {
    this.items = []
    this.textLedger.clear()
  }

  private isQueued(text: string): boolean {
    const key = normalizeCommentKey(text)
    return this.items.some((item) => normalizeCommentKey(item.text) === key)
  }

  push(comments: CommentDraft[]): void {
    const now = Date.now()
    for (const comment of comments) {
      const text = sanitizeCommentText(comment.text)
      if (!text) continue
      if (now > comment.expiresAt) continue
      if (this.textLedger.has(text) || this.isQueued(text)) continue
      this.items.push({ ...comment, text })
    }
    this.items = this.items
      .filter((c) => c.expiresAt > now)
      .slice(-QUEUE.maxBuffer)
  }

  /**
   * Insert a comment at the front so it surfaces on the next spawn tick.
   * Used for mouse-cursor reactions, which should feel immediate.
   */
  pushFront(comment: CommentDraft): void {
    const now = Date.now()
    const text = sanitizeCommentText(comment.text)
    if (!text || now > comment.expiresAt) return
    if (this.textLedger.has(text) || this.isQueued(text)) return
    this.items.unshift({ ...comment, text })
    this.items = this.items.filter((c) => c.expiresAt > now).slice(0, QUEUE.maxBuffer)
  }

  needsRefill(): boolean {
    return this.items.length < QUEUE.minBuffer
  }

  size(): number {
    return this.items.length
  }

  shift(): CommentDraft | null {
    const now = Date.now()
    while (this.items.length > 0) {
      const next = this.items.shift()
      if (!next) return null
      if (next.expiresAt > now) {
        this.textLedger.add(next.text)
        return next
      }
    }
    return null
  }

  spawnIntervalMs(): number {
    if (this.density === 'buzz') return DISPLAY.spawnIntervalBuzzMs
    if (this.density === 'busy') return DISPLAY.spawnIntervalBusyMs
    return DISPLAY.spawnIntervalNormalMs
  }

  /** Next spawn delay with human-like jitter and occasional longer pauses. */
  nextSpawnDelayMs(): number {
    const base = this.spawnIntervalMs()

    if (Math.random() < DISPLAY.spawnPauseChance) {
      const pause =
        DISPLAY.spawnPauseMultiplierMin +
        Math.random() * (DISPLAY.spawnPauseMultiplierMax - DISPLAY.spawnPauseMultiplierMin)
      return Math.round(base * pause)
    }

    const factor =
      DISPLAY.spawnJitterMin + Math.random() * (DISPLAY.spawnJitterMax - DISPLAY.spawnJitterMin)
    return Math.round(base * factor)
  }

  /** Gap between two comments inside the same burst. */
  burstStaggerMs(): number {
    const min = DISPLAY.burstStaggerMinMs
    const max = DISPLAY.burstStaggerMaxMs
    return Math.round(min + Math.random() * (max - min))
  }

  /** How many comments to show in one tick (burst mode) */
  burstCount(): number {
    if (this.density === 'buzz') return Math.random() < 0.28 ? 2 : 1
    if (Math.random() < DISPLAY.spawnBurstChance) return Math.random() < 0.35 ? 3 : 2
    return 1
  }
}
