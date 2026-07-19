import type { PageKind, ResolvedLanguage } from './types'

type PersonaPool = Record<PageKind, string[]>

const JA: PersonaPool = {
  news: ['懐疑的な人', '共感する人', '皮肉屋', '要約する人'],
  blog: ['共感する人', '素朴な人', '疑問を持つ人', 'テンションが高い人'],
  tech: ['詳しい人', '疑問を持つ人', '要約する人', '学習目的の人'],
  github: ['技術に詳しい人', 'せっかちな人', 'エラー経験者', '懐疑的な人'],
  wikipedia: ['学習目的の人', '疑問を持つ人', '途中から来た人', '冷静な人'],
  sns: ['短文反応', 'ツッコミ', '共感', 'ネットスラング多用'],
  video: ['リアクション多め', '共感', 'ツッコミ', '途中参加'],
  docs: ['真面目な人', '疑問を持つ人', '要約する人', '眠そうな人'],
  unknown: ['素朴な人', '皮肉屋', '共感する人', 'テンションが高い人'],
}

const EN: PersonaPool = {
  news: ['skeptical reader', 'empathetic reader', 'sarcastic commenter', 'summarizer'],
  blog: ['supportive reader', 'curious newbie', 'question asker', 'hype poster'],
  tech: ['expert reader', 'question asker', 'summarizer', 'learner'],
  github: ['senior dev', 'impatient reviewer', 'bug survivor', 'skeptic'],
  wikipedia: ['learner', 'question asker', 'late joiner', 'calm reader'],
  sns: ['short reactions', 'roaster', 'empathy', 'slang heavy'],
  video: ['reaction spam', 'empathy', 'roaster', 'late viewer'],
  docs: ['serious reader', 'question asker', 'summarizer', 'sleepy reader'],
  unknown: ['casual reader', 'sarcastic commenter', 'empathetic reader', 'hype poster'],
}

const ZH_HANS: PersonaPool = {
  news: ['怀疑派', '共情派', '吐槽党', '总结党'],
  blog: ['共鸣党', '路人', '疑问党', '兴奋党'],
  tech: ['懂哥', '提问党', '总结党', '学习者'],
  github: ['老程序员', '急性子', '踩坑人', '怀疑派'],
  wikipedia: ['学习者', '提问党', '中途加入', '冷静党'],
  sns: ['短评', '吐槽', '共鸣', '网络用语'],
  video: ['反应怪', '共鸣', '吐槽', '半路加入'],
  docs: ['认真党', '提问党', '总结党', '犯困党'],
  unknown: ['路人', '吐槽党', '共鸣党', '兴奋党'],
}

const ZH_HANT: PersonaPool = {
  news: ['懷疑派', '共情派', '吐槽黨', '總結黨'],
  blog: ['共鳴黨', '路人', '疑問黨', '興奮黨'],
  tech: ['懂哥', '提問黨', '總結黨', '學習者'],
  github: ['老程式員', '急性子', '踩坑人', '懷疑派'],
  wikipedia: ['學習者', '提問黨', '中途加入', '冷靜黨'],
  sns: ['短評', '吐槽', '共鳴', '網路用語'],
  video: ['反應怪', '共鳴', '吐槽', '半路加入'],
  docs: ['認真黨', '提問黨', '總結黨', '犯睏黨'],
  unknown: ['路人', '吐槽黨', '共鳴黨', '興奮黨'],
}

const POOLS: Record<ResolvedLanguage, PersonaPool> = {
  ja: JA,
  en: EN,
  'zh-Hans': ZH_HANS,
  'zh-Hant': ZH_HANT,
}

/** Internal-only persona mix. Never exposed in settings (spec §9). */
export function personaBias(kind: PageKind, language: ResolvedLanguage): string[] {
  return POOLS[language][kind] ?? POOLS[language].unknown
}
