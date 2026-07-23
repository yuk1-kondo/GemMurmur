import type { CommentLanguage, ResolvedLanguage } from './types'

export function detectLanguageFromText(text: string): ResolvedLanguage {
  const sample = text.slice(0, 2000)
  if (!sample.trim()) return 'en'

  const han = (sample.match(/[\u4e00-\u9fff]/g) ?? []).length
  const kana = (sample.match(/[\u3040-\u30ff]/g) ?? []).length
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length

  if (kana > 5 || (kana > 0 && han > 0)) return 'ja'
  if (han > latin * 0.4 && han > 8) {
    // Heuristic: traditional markers
    if (/[國語體學門開關發經]/.test(sample)) return 'zh-Hant'
    return 'zh-Hans'
  }
  return 'en'
}

export function resolveLanguage(
  setting: CommentLanguage,
  pageLanguage: ResolvedLanguage,
): ResolvedLanguage {
  if (setting === 'auto') return pageLanguage
  return setting
}
