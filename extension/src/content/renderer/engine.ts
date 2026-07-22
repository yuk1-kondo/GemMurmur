import type { CommentDraft, DensityMode, DisplayComment } from '@/shared/types'
import { INTERACTION } from '@/shared/constants'
import { CommentTextLedger } from '@/shared/text-dedup'
import { ensureOverlayRoot } from '../overlay/root'
import { isRightToLeft } from '@/shared/language'
import { LaneManager } from './lanes'
import {
  colorCss,
  durationForText,
  estimateBackgroundIsDark,
  fontSizePx,
  pickColor,
  pickPlacement,
  pickSize,
  pickSlangColor,
  pickSlangPlacement,
  pickSlangSize,
  resetBackgroundCache,
  textShadow,
} from './style'

export class CommentRenderer {
  private root: HTMLElement
  private lanes = new LaneManager()
  private density: DensityMode = 'normal'
  private active = 0
  private textLedger = new CommentTextLedger(INTERACTION.sameTextCooldownMs)

  constructor() {
    this.root = ensureOverlayRoot()
    this.lanes.setDensity('normal')
    resetBackgroundCache()
  }

  setDensity(density: DensityMode): void {
    this.density = density
    this.lanes.setDensity(density)
  }

  showStatus(
    message: string,
    level: 'info' | 'error' | 'warn' = 'info',
    placement: 'corner' | 'center' = level === 'error' ? 'center' : 'corner',
    options: { persist?: boolean } = {},
  ): void {
    this.clearStatus()
    const el = document.createElement('div')
    el.className = `murmur-status ${level} ${placement}`
    el.textContent = message
    el.dir = /[\u0600-\u06ff]/.test(message) ? 'rtl' : 'auto'
    this.root.appendChild(el)
    if (options.persist) return
    window.setTimeout(() => el.remove(), level === 'error' ? 8_000 : 4_000)
  }

  clearStatus(): void {
    this.root.querySelectorAll('.murmur-status').forEach((node) => node.remove())
  }

  /** Remove floating comments only (keeps controls / status). */
  clearComments(): void {
    this.root.querySelectorAll('.murmur-comment').forEach((node) => node.remove())
    this.active = 0
    this.textLedger.clear()
  }

  enqueue(draft: CommentDraft): void {
    if (!draft.isBuzz && this.textLedger.has(draft.text)) return
    if (!draft.isBuzz) this.textLedger.add(draft.text)
    const darkBg = estimateBackgroundIsDark()
    const slangy = draft.source === 'interaction' || draft.category === 'crowd'
    const buzzVisual = this.density === 'buzz' || draft.isBuzz === true
    const size = slangy
      ? pickSlangSize(buzzVisual)
      : pickSize(draft.emphasis, this.density, draft.text, draft.importance)
    const placement =
      draft.preferredPlacement ??
      (slangy
        ? pickSlangPlacement(buzzVisual)
        : pickPlacement(draft.category, draft.emphasis, draft.text))
    const color = slangy
      ? pickSlangColor(!darkBg, buzzVisual)
      : pickColor(draft.emphasis, !darkBg)
    const durationMs = durationForText(draft.text, size)
    // A deliberately rare reverse traveller adds a small arcade-like surprise
    // while preserving the conventional right-to-left stream as the default.
    const flowDirection =
      placement === 'scroll' && !buzzVisual && Math.random() < 0.035
        ? 'left-to-right' as const
        : 'right-to-left' as const
    const display: DisplayComment = {
      ...draft,
      size,
      placement,
      color,
      durationMs,
      flowDirection,
    }
    this.mount(display)
  }

  private mount(comment: DisplayComment): void {
    const el = document.createElement('div')
    el.className = 'murmur-comment'
    el.textContent = comment.text.replace(/[\r\n]+/g, ' ').trim()
    el.dir = isRightToLeft(comment.language) ? 'rtl' : 'auto'
    if (isRightToLeft(comment.language)) el.classList.add('murmur-comment-rtl')
    el.style.color = colorCss(comment.color)
    el.style.fontSize = `${fontSizePx(comment.size)}px`
    el.style.textShadow = textShadow(comment.color)

    if (comment.placement === 'center') {
      el.classList.add('murmur-comment-center')
      el.style.left = '50%'
      el.style.top = '50%'
      el.style.transform = 'translate(-50%, -50%) scale(1.35)'
      el.style.opacity = '0'
      this.root.appendChild(el)
      this.active += 1
      requestAnimationFrame(() => {
        el.style.transition =
          'transform 380ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 220ms ease-out'
        el.style.transform = 'translate(-50%, -50%) scale(1)'
        el.style.opacity = '1'
      })
      window.setTimeout(() => {
        el.style.transition = 'opacity 280ms ease-in'
        el.style.opacity = '0'
        window.setTimeout(() => {
          el.remove()
          this.active -= 1
        }, 300)
      }, comment.durationMs)
      return
    }

    if (comment.placement === 'top' || comment.placement === 'bottom') {
      el.style.left = '50%'
      el.style.transform = 'translateX(-50%)'
      el.style.top = comment.placement === 'top' ? '6%' : 'auto'
      el.style.bottom = comment.placement === 'bottom' ? '8%' : 'auto'
      el.style.opacity = '0'
      this.root.appendChild(el)
      this.active += 1
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 180ms ease'
        el.style.opacity = '1'
      })
      window.setTimeout(() => {
        el.style.opacity = '0'
        window.setTimeout(() => {
          el.remove()
          this.active -= 1
        }, 220)
      }, comment.durationMs)
      return
    }

    const lane = this.lanes.pickLane(performance.now(), comment.durationMs)
    el.style.top = `${this.lanes.laneTopPercent(lane)}%`
    const flowsLeftToRight = comment.flowDirection === 'left-to-right'
    if (flowsLeftToRight) {
      el.style.right = '100%'
      el.style.left = 'auto'
    } else {
      el.style.left = '100%'
      el.style.right = 'auto'
    }
    el.style.transform = 'translateX(0)'
    this.root.appendChild(el)
    this.active += 1

    requestAnimationFrame(() => {
      const travel = window.innerWidth + el.offsetWidth + 40
      el.style.transition = `transform ${comment.durationMs}ms linear`
      el.style.transform = `translateX(${flowsLeftToRight ? travel : -travel}px)`
    })

    window.setTimeout(() => {
      el.remove()
      this.active -= 1
    }, comment.durationMs + 40)
  }

  get activeCount(): number {
    return this.active
  }

  destroy(): void {
    this.textLedger.clear()
    this.root.querySelectorAll('.murmur-comment, .murmur-status').forEach((n) => n.remove())
  }
}
