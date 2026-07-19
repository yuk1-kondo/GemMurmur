import { QUEUE } from '../constants'
import { createId } from '../id'
import type {
  CommentCategory,
  CommentDraft,
  PageContext,
  PageKind,
  ResolvedLanguage,
} from '../types'
import { normalizeCommentKey } from '../text-dedup'
import { pickRuleText } from './pools'

const recentTexts = new Map<string, number>()

function rememberText(text: string): void {
  recentTexts.set(normalizeCommentKey(text), Date.now())
  if (recentTexts.size > 64) {
    const oldest = recentTexts.keys().next().value
    if (oldest) recentTexts.delete(oldest)
  }
}

function recentSet(): Set<string> {
  return new Set(recentTexts.keys())
}

function clip(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function firstPhrase(text: string, max = 28): string {
  const line = text.split(/\n|[。.!?！？]/)[0]?.trim() ?? ''
  return clip(line, max)
}

function keywordFromContext(context: PageContext): string {
  const fromHeading = context.headings.find((h) => h.length >= 2)
  if (fromHeading) return clip(fromHeading, 20)
  if (context.title) return clip(context.title, 20)
  return ''
}

type TemplateBuilder = (ctx: {
  keyword: string
  phrase: string
  kind: PageKind
  description: string
}) => string

const KIND_TEMPLATES: Record<ResolvedLanguage, Partial<Record<PageKind, TemplateBuilder[]>>> = {
  ja: {
    news: [
      ({ keyword }) => (keyword ? `「${keyword}」マジ？` : 'ニュース速報か'),
      ({ phrase }) => (phrase ? `${phrase}って本当？` : 'ソースは？'),
      () => 'どっちが正しいんだ',
      () => '続報待ち',
    ],
    tech: [
      ({ keyword }) => (keyword ? `${keyword}、触ったことない` : '難しそう'),
      ({ phrase }) => (phrase ? `${phrase}…どういうこと` : 'APIどれ'),
      () => 'ドキュメント長い',
      () => 'サンプルコードください',
    ],
    github: [
      ({ keyword }) => (keyword ? `${keyword}、starつけるわ` : 'README読むか'),
      () => 'Issue多すぎ',
      () => 'PR見るの疲れる',
      ({ phrase }) => (phrase ? `${phrase}って書いてある` : 'ライセンス大丈夫？'),
    ],
    wikipedia: [
      ({ keyword }) => (keyword ? `「${keyword}」知らんかった` : 'なるほど記事'),
      () => '途中から参加',
      () => '出典ちゃんとある？',
      ({ phrase }) => (phrase ? `${phrase}…深い` : '関連項目行くか'),
    ],
    blog: [
      ({ keyword }) => (keyword ? `${keyword}いいな` : 'いい記事'),
      () => '共感した',
      ({ phrase }) => (phrase ? `${phrase}わかる` : '続き気になる'),
      () => 'コメント欄どこ',
    ],
    sns: [
      ({ phrase }) => phrase || 'タイムライン速い',
      () => '誰の投稿？',
      () => 'いいね押し忘れ',
      () => '炎上？',
    ],
  },
  en: {
    news: [
      ({ keyword }) => (keyword ? `${keyword}? seriously?` : 'breaking huh'),
      () => 'source?',
      ({ phrase }) => (phrase ? `${phrase} — real?` : 'need more context'),
      () => 'wild headline',
    ],
    tech: [
      ({ keyword }) => (keyword ? `never used ${keyword}` : 'looks dense'),
      () => 'docs are long',
      ({ phrase }) => (phrase ? `${phrase}? explain` : 'where is the example'),
      () => 'ship it anyway',
    ],
    github: [
      ({ keyword }) => (keyword ? `bookmarking ${keyword}` : 'readme time'),
      () => 'issues piling up',
      () => 'who maintains this',
      ({ phrase }) => (phrase ? `says ${phrase}` : 'license check'),
    ],
    wikipedia: [
      ({ keyword }) => (keyword ? `TIL ${keyword}` : 'rabbit hole'),
      () => 'citations look ok?',
      () => 'joined mid-article',
      ({ phrase }) => (phrase ? `${phrase} huh` : 'related tab time'),
    ],
    blog: [
      ({ keyword }) => (keyword ? `nice post on ${keyword}` : 'good read'),
      () => 'relatable',
      ({ phrase }) => (phrase ? `${phrase} mood` : 'more please'),
      () => 'where are comments',
    ],
    sns: [
      ({ phrase }) => phrase || 'timeline moving fast',
      () => 'who posted this',
      () => 'ratio incoming?',
      () => 'bookmarking',
    ],
  },
  'zh-Hans': {
    news: [
      ({ keyword }) => (keyword ? `「${keyword}」真的？` : '新闻？'),
      () => '有来源吗',
      ({ phrase }) => (phrase ? `${phrase}…等等` : '后续呢'),
      () => '吃瓜',
    ],
    tech: [
      ({ keyword }) => (keyword ? `${keyword}没用过` : '好难'),
      () => '文档太长',
      ({ phrase }) => (phrase ? `${phrase}啥意思` : '示例呢'),
      () => '能跑就行',
    ],
    github: [
      ({ keyword }) => (keyword ? `star ${keyword}` : '看README'),
      () => 'issue好多',
      () => '维护者还在吗',
      ({ phrase }) => (phrase ? `写着${phrase}` : '协议OK？'),
    ],
    wikipedia: [
      ({ keyword }) => (keyword ? `原来${keyword}` : '涨知识'),
      () => '引用靠谱吗',
      () => '半路加入',
      ({ phrase }) => (phrase ? `${phrase}…` : '相关条目走起'),
    ],
    blog: [
      ({ keyword }) => (keyword ? `${keyword}不错` : '好文'),
      () => '有共鸣',
      ({ phrase }) => (phrase ? `${phrase}懂` : '还想看'),
      () => '评论呢',
    ],
    sns: [
      ({ phrase }) => phrase || '刷得好快',
      () => '谁发的',
      () => '要火？',
      () => '先收藏',
    ],
  },
  'zh-Hant': {
    news: [
      ({ keyword }) => (keyword ? `「${keyword}」真的？` : '新聞？'),
      () => '有來源嗎',
      ({ phrase }) => (phrase ? `${phrase}…等等` : '後續呢'),
      () => '吃瓜',
    ],
    tech: [
      ({ keyword }) => (keyword ? `${keyword}沒用過` : '好難'),
      () => '文件太長',
      ({ phrase }) => (phrase ? `${phrase}啥意思` : '範例呢'),
      () => '能跑就行',
    ],
    github: [
      ({ keyword }) => (keyword ? `star ${keyword}` : '看README'),
      () => 'issue好多',
      () => '維護者還在嗎',
      ({ phrase }) => (phrase ? `寫著${phrase}` : '授權OK？'),
    ],
    wikipedia: [
      ({ keyword }) => (keyword ? `原來${keyword}` : '漲知識'),
      () => '引用靠譜嗎',
      () => '半路加入',
      ({ phrase }) => (phrase ? `${phrase}…` : '相關條目走起'),
    ],
    blog: [
      ({ keyword }) => (keyword ? `${keyword}不錯` : '好文'),
      () => '有共鳴',
      ({ phrase }) => (phrase ? `${phrase}懂` : '還想看'),
      () => '評論呢',
    ],
    sns: [
      ({ phrase }) => phrase || '刷得好快',
      () => '誰發的',
      () => '要火？',
      () => '先收藏',
    ],
  },
}

const GENERIC_TEMPLATES: Record<ResolvedLanguage, TemplateBuilder[]> = {
  ja: [
    ({ keyword }) => (keyword ? `「${keyword}」ほう` : 'ほう'),
    ({ phrase }) => (phrase ? `${phrase}？` : 'なるほど'),
    ({ description }) => (description ? `${clip(description, 18)}…` : 'それで？'),
    () => 'マジか',
    () => 'ソースは？',
    () => 'ちょい待て',
    () => 'たしかに',
    () => 'どういうこと',
  ],
  en: [
    ({ keyword }) => (keyword ? `${keyword} huh` : 'huh'),
    ({ phrase }) => (phrase ? `${phrase}?` : 'interesting'),
    ({ description }) => (description ? `${clip(description, 22)}…` : 'wait what'),
    () => 'source?',
    () => 'say more',
    () => 'fair',
    () => 'wild',
    () => 'ok but why',
  ],
  'zh-Hans': [
    ({ keyword }) => (keyword ? `「${keyword}」哦？` : '哦？'),
    ({ phrase }) => (phrase ? `${phrase}？` : '有点意思'),
    ({ description }) => (description ? `${clip(description, 16)}…` : '然后呢'),
    () => '真的假的',
    () => '来源呢',
    () => '等等',
    () => '懂了',
    () => '啥情况',
  ],
  'zh-Hant': [
    ({ keyword }) => (keyword ? `「${keyword}」哦？` : '哦？'),
    ({ phrase }) => (phrase ? `${phrase}？` : '有點意思'),
    ({ description }) => (description ? `${clip(description, 16)}…` : '然後呢'),
    () => '真的假的',
    () => '來源呢',
    () => '等等',
    () => '懂了',
    () => '啥情況',
  ],
}

const CATEGORY_CYCLE: CommentCategory[] = [
  'content',
  'question',
  'tsukkomi',
  'empathy',
  'summary',
]

function buildCandidates(language: ResolvedLanguage, context: PageContext): string[] {
  const keyword = keywordFromContext(context)
  const phrase = firstPhrase(context.viewportText || context.nearbyText || context.description)
  const description = context.description
  const kindPool = KIND_TEMPLATES[language][context.kind] ?? []
  const generic = GENERIC_TEMPLATES[language]
  const args = { keyword, phrase, kind: context.kind, description }

  const lines: string[] = []
  for (const builder of [...kindPool, ...generic]) {
    const line = builder(args).trim()
    if (line.length >= 2 && line.length <= 64) lines.push(line)
  }

  for (let i = 0; i < 4; i++) {
    lines.push(pickRuleText(language, 'ambient', new Set(lines.map(normalizeCommentKey))))
  }

  return lines
}

function makeDraft(
  language: ResolvedLanguage,
  text: string,
  category: CommentCategory,
  emphasis: number,
): CommentDraft {
  rememberText(text)
  const now = Date.now()
  return {
    id: createId('rule'),
    text,
    category,
    emotion: category === 'question' ? 'curious' : category === 'tsukkomi' ? 'amused' : 'neutral',
    importance: 0.45 + emphasis * 0.35,
    emphasis: 0.35 + emphasis * 0.45,
    language,
    source: 'rule',
    createdAt: now,
    expiresAt: now + QUEUE.ttlMs,
  }
}

/** Context-aware rule fallback when Gemma returns nothing. */
export function createContextualFallbackBatch(
  language: ResolvedLanguage,
  context: PageContext,
  count: number,
): CommentDraft[] {
  const candidates = buildCandidates(language, context)
  const used = recentSet()
  const batch: CommentDraft[] = []

  for (let i = 0; i < count; i++) {
    let text = ''
    for (let attempt = 0; attempt < candidates.length; attempt++) {
      const candidate = candidates[(i + attempt) % candidates.length]
      const key = normalizeCommentKey(candidate)
      if (!used.has(key)) {
        text = candidate
        used.add(key)
        break
      }
    }
    if (!text) {
      text = pickRuleText(language, 'ambient', used)
      used.add(normalizeCommentKey(text))
    }
    const category = CATEGORY_CYCLE[i % CATEGORY_CYCLE.length]
    batch.push(makeDraft(language, text, category, (i % 3) * 0.15))
  }

  return batch
}
