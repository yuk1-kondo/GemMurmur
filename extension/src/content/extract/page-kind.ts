import type { PageKind } from '@/shared/types'

export function detectPageKind(url: URL, title: string, text: string): PageKind {
  const host = url.hostname
  if (host.includes('wikipedia.org')) return 'wikipedia'
  if (host.includes('github.com')) return 'github'
  if (/youtube\.com|vimeo\.com|nicovideo\.jp/.test(host)) return 'video'
  if (/twitter\.com|x\.com|facebook\.com|instagram\.com|reddit\.com|bsky\.app/.test(host)) {
    return 'sns'
  }
  if (/docs\.google\.com/.test(host)) return 'docs'

  const blob = `${title}\n${text}`.toLowerCase()
  if (/news|記事|報道|breaking|reuters|bloomberg|nytimes|asahi|nikkei/.test(host + blob)) {
    return 'news'
  }
  if (/readme|api reference|documentation|docs|仕様|チュートリアル|tutorial/.test(blob)) {
    return 'tech'
  }
  if (/blog|medium\.com|substack\.com|はてな|note\.com/.test(host + blob)) {
    return 'blog'
  }
  return 'unknown'
}
