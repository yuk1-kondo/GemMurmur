import { pageKeyFromUrl } from './page-key'
import type { MurmurSettings, PageContext } from './types'

export function isStopped(settings: MurmurSettings, ctx: PageContext): boolean {
  if (!settings.enabled || settings.paused) return true
  if (settings.stoppedDomains.includes(ctx.hostname)) return true
  if (settings.stoppedPages.includes(pageKeyFromUrl(ctx.url))) return true
  return false
}

/**
 * Hard stop = fully off (disabled or page/site stopped), overlay removed.
 * Distinct from `paused`, which keeps the overlay + resume button visible.
 */
export function isHardStopped(settings: MurmurSettings, ctx: PageContext): boolean {
  if (!settings.enabled) return true
  if (settings.stoppedDomains.includes(ctx.hostname)) return true
  if (settings.stoppedPages.includes(pageKeyFromUrl(ctx.url))) return true
  return false
}
