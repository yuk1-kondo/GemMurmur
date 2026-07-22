import type { CommentLanguage, ResolvedLanguage } from './types'

export const SUPPORTED_LANGUAGES: readonly ResolvedLanguage[] = [
  'en',
  'ja',
  'zh-Hans',
  'zh-Hant',
  'es',
  'fr',
  'de',
  'pt-BR',
  'it',
  'ko',
  'ru',
  'ar',
  'hi',
  'id',
  'tr',
  'vi',
  'th',
] as const

export const LANGUAGE_NAMES: Record<ResolvedLanguage, string> = {
  ar: 'العربية',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  th: 'ไทย',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
}

export function isResolvedLanguage(value: string): value is ResolvedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/** Convert browser/page language tags to the language variants GemMurmur supports. */
export function languageFromTag(tag?: string | null): ResolvedLanguage | null {
  const normalized = tag?.trim().replace(/_/g, '-').toLowerCase()
  if (!normalized) return null
  if (normalized === 'zh-hant' || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk') || normalized.startsWith('zh-mo')) return 'zh-Hant'
  if (normalized === 'zh-hans' || normalized.startsWith('zh')) return 'zh-Hans'
  if (normalized.startsWith('pt')) return 'pt-BR'
  const primary = normalized.split('-')[0]
  return isResolvedLanguage(primary) ? primary : null
}

export function isRightToLeft(language: ResolvedLanguage): boolean {
  return language === 'ar'
}

export function detectLanguageFromText(text: string, declaredLanguage?: string | null): ResolvedLanguage {
  const declared = languageFromTag(declaredLanguage)
  if (declared) return declared
  const sample = text.slice(0, 2000)
  if (!sample.trim()) return 'en'

  const han = (sample.match(/[\u4e00-\u9fff]/g) ?? []).length
  const kana = (sample.match(/[\u3040-\u30ff]/g) ?? []).length
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length

  if (/[\uac00-\ud7af]/.test(sample)) return 'ko'
  if (/[\u0600-\u06ff]/.test(sample)) return 'ar'
  if (/[\u0900-\u097f]/.test(sample)) return 'hi'
  if (/[\u0e00-\u0e7f]/.test(sample)) return 'th'
  if (/[\u0400-\u04ff]/.test(sample)) return 'ru'
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
