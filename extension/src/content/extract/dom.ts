import { EXTRACTION } from '@/shared/constants'
import { detectLanguageFromText } from '@/shared/language'
import type { PageContext } from '@/shared/types'
import { normalizeCommentKey } from '@/shared/text-dedup'
import { detectPageKind } from './page-kind'
import { detectPrivatePage } from './private'

let lastScrollAt = 0

export function markScrollActivity(): void {
  lastScrollAt = performance.now()
}

export function isScrollIdle(minMs = 450): boolean {
  return performance.now() - lastScrollAt >= minMs
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', markScrollActivity, { passive: true })
}

const EXCLUDE_SELECTOR = [
  'script',
  'style',
  'noscript',
  'svg',
  'nav',
  'footer',
  'aside',
  'form',
  'input',
  'textarea',
  '[contenteditable="true"]',
  '[aria-hidden="true"]',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '.cookie',
  '#cookie',
  '.ads',
  '.advertisement',
  '.comment',
  '.comments',
  '#comments',
].join(',')

const BLOCK_SELECTOR = 'p, li, pre, blockquote, td, figcaption, dt, dd, h5, h6'

function isExcluded(el: Element): boolean {
  return Boolean(el.closest(EXCLUDE_SELECTOR))
}

function visibleText(el: Element): string {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return ''
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return ''
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function contentRoots(): Element[] {
  const scoped = [...document.querySelectorAll('main, article, [role="main"]')].filter(
    (el) => !isExcluded(el),
  )
  if (scoped.length > 0) return scoped.slice(0, EXTRACTION.maxContentRoots)
  return [document.body]
}

function collectHeadings(): string[] {
  return [...document.querySelectorAll('h1, h2, h3, h4')]
    .map((el) => visibleText(el))
    .filter(Boolean)
    .slice(0, 20)
}

function minTextLength(kind: PageContext['kind']): number {
  return kind === 'sns' ? 4 : 10
}

function collectViewportText(kind: PageContext['kind']): { viewport: string; nearby: string } {
  const vh = window.innerHeight
  const minLen = minTextLength(kind)
  const seen = new Set<string>()
  const inView: string[] = []
  const nearby: string[] = []
  let scanned = 0
  let charBudget = 0

  function tryAdd(text: string, zone: 'viewport' | 'nearby'): boolean {
    const key = normalizeCommentKey(text)
    if (seen.has(key)) return false
    seen.add(key)
    if (zone === 'viewport') inView.push(text)
    else nearby.push(text)
    charBudget += text.length
    return charBudget >= EXTRACTION.minCharsBeforeStop
  }

  outer: for (const root of contentRoots()) {
    const blocks = root.querySelectorAll(BLOCK_SELECTOR)
    for (const el of blocks) {
      if (scanned >= EXTRACTION.maxScanElements) break outer
      scanned += 1
      if (isExcluded(el)) continue

      const rect = el.getBoundingClientRect()
      const text = visibleText(el)
      if (!text || text.length < minLen) continue

      if (rect.bottom >= 0 && rect.top <= vh) {
        if (tryAdd(text, 'viewport')) break outer
      } else if (rect.top > vh && rect.top <= vh * 2.5) {
        if (tryAdd(text, 'nearby')) break outer
      } else if (rect.bottom < 0 && rect.bottom >= -vh) {
        if (tryAdd(text, 'nearby')) break outer
      }
    }
  }

  return {
    viewport: inView.join('\n').slice(0, EXTRACTION.viewportTextMax),
    nearby: nearby.join('\n').slice(0, EXTRACTION.nearbyTextMax),
  }
}

function metaDescription(): string {
  const el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  return el?.content?.trim() ?? ''
}

function imageAlts(): string[] {
  const alts: string[] = []
  for (const img of document.querySelectorAll('img[alt]')) {
    if (alts.length >= 12) break
    const alt = (img.getAttribute('alt') ?? '').trim()
    if (alt.length > 2 && alt.length < 120) alts.push(alt)
  }
  return alts
}

export function extractPageContext(): PageContext {
  const url = new URL(location.href)
  const privateInfo = detectPrivatePage(url)
  const headings = collectHeadings()
  const title = document.title.trim()
  const description = metaDescription()
  const languageSample = [title, description, ...headings].join('\n')
  const language = detectLanguageFromText(languageSample, document.documentElement.lang)
  const kind = detectPageKind(url, title, languageSample)
  const { viewport, nearby } = collectViewportText(kind)
  const alts = imageAlts()

  return {
    url: url.href,
    hostname: url.hostname,
    title,
    description,
    kind,
    language,
    headings,
    viewportText: viewport,
    nearbyText: nearby,
    summaryHints: [...headings.slice(0, 5), ...alts.slice(0, 5)],
    isPrivate: privateInfo.private,
    privateReason: privateInfo.reason,
  }
}
