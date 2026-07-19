import { personaBias } from '@/shared/personas'
import type { PageContext, ResolvedLanguage } from '@/shared/types'

const STYLE_ANGLES: Record<ResolvedLanguage, readonly string[]> = {
  ja: [
    'ツッコミ・共感・疑問・軽い皮肉を混ぜる。',
    '疑問形多め。わからない点を短く聞く。',
    '共感多め。「わかる」「それな」系。',
    '懐疑的に。根拠や出典を短く突っ込む。',
    'ネットスラング多め。雑談っぽく。',
    '技術読者っぽく。細部や比較に触れる。',
  ],
  en: [
    'Mix tsukkomi, empathy, skeptical questions, and light sarcasm.',
    'Curious crowd: ask short questions about unclear points.',
    'Supportive crowd: agree, relate, and react emotionally.',
    'Skeptical crowd: doubt claims, ask for sources, poke holes gently.',
    'Casual chat: internet slang, jokes, and offhand reactions.',
    'Technical readers: note details, compare, or nitpick lightly.',
  ],
  'zh-Hans': [
    '混合吐槽、共鸣、疑问和轻微讽刺。',
    '多问短问题，针对不清楚的地方。',
    '共鸣为主，像弹幕聊天。',
    '怀疑态度，要求来源或证据。',
    '网络用语多，口语化。',
    '技术读者风格，关注细节。',
  ],
  'zh-Hant': [
    '混合吐槽、共鳴、疑問和輕微諷刺。',
    '多問短問題，針對不清楚的地方。',
    '共鳴為主，像彈幕聊天。',
    '懷疑態度，要求來源或證據。',
    '網路用語多，口語化。',
    '技術讀者風格，關注細節。',
  ],
}

const EXAMPLE_LINES: Record<ResolvedLanguage, string[]> = {
  ja: ['なるほど', 'それで？', 'マジか', 'ソースは？', 'www', '草', 'ｷﾀ━━(ﾟ∀ﾟ)━━!!', '神回'],
  en: ['huh', 'wait what', 'source?', 'fair point', 'lol', 'based', 'W'],
  'zh-Hans': ['真的假的', '所以呢', '来源呢', '有点东西', '2333', 'yyds', '绝了'],
  'zh-Hant': ['真的假的', '所以呢', '來源呢', '有點東西', '2333', 'yyds', '絕了'],
}

/** Encourage nico-douga style net slang so the crowd feels alive. */
function slangHint(language: ResolvedLanguage): string {
  switch (language) {
    case 'ja':
      return '- w / www / 草 / ｷﾀ━━(ﾟ∀ﾟ)━━!! のようなネットスラングやニコ動風のノリも時々混ぜてよい'
    case 'zh-Hans':
      return '- 可以偶尔使用网络用语（2333 / yyds / 绝了 / 草）'
    case 'zh-Hant':
      return '- 可以偶爾使用網路用語（2333 / yyds / 絕了 / 草）'
    default:
      return '- Occasionally sprinkle internet slang (lol, lmao, based, W)'
  }
}

function personaHint(context: PageContext, language: ResolvedLanguage): string {
  const voices = personaBias(context.kind, language).join(', ')
  if (language === 'ja') return `観客の雰囲気: ${voices}`
  if (language === 'en') return `Crowd vibe: ${voices}`
  return `观众氛围: ${voices}`
}

function languageName(lang: ResolvedLanguage): string {
  switch (lang) {
    case 'ja':
      return 'Japanese'
    case 'zh-Hans':
      return 'Simplified Chinese'
    case 'zh-Hant':
      return 'Traditional Chinese'
    default:
      return 'English'
  }
}

function pickStyleAngle(language: ResolvedLanguage): string {
  const pool = STYLE_ANGLES[language]
  return pool[Math.floor(Math.random() * pool.length)]
}

function avoidBlock(language: ResolvedLanguage, recent: string[]): string {
  if (recent.length === 0) return ''
  const list = recent.slice(-12).join(' / ')
  if (language === 'ja') return `既出と同じ・言い換えも禁止: ${list}`
  if (language === 'en') return `Do NOT repeat or paraphrase: ${list}`
  return `不要重复或改写: ${list}`
}

function formatContextBlock(context: PageContext): string {
  const headings = context.headings.slice(0, 6).join(' / ')
  const hints = context.summaryHints.slice(0, 6).join(' / ')
  return [
    `Page type: ${context.kind}`,
    `Title: ${context.title}`,
    context.description ? `Description: ${context.description.slice(0, 200)}` : '',
    headings ? `Headings: ${headings}` : '',
    hints ? `Hints: ${hints}` : '',
    `Visible text:\n${context.viewportText.slice(0, 700)}`,
    context.nearbyText ? `Nearby text:\n${context.nearbyText.slice(0, 350)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function reactionRule(language: ResolvedLanguage): string {
  if (language === 'ja') {
    return 'Visible/Nearby に書いてあることだけに反応。書いてないことは推測しない。'
  }
  if (language === 'en') {
    return 'React only to facts in Visible/Nearby text. Do not invent details.'
  }
  return '只评论 Visible/Nearby 中出现的内容，不要编造。'
}

/** Primary prompt: line-based output (easier for small models than JSON). */
export function buildCommentPrompt(
  context: PageContext,
  count: number,
  language: ResolvedLanguage,
  avoidRecent: string[] = [],
): string {
  const lang = languageName(language)
  const angle = pickStyleAngle(language)
  const examples = EXAMPLE_LINES[language].join(' / ')
  return [
    `Write exactly ${count} short live-audience comments in ${lang} only.`,
    `Style: ${angle}`,
    reactionRule(language),
    'Rules:',
    '- One comment per line',
    '- No numbering, bullets, JSON, or quotes',
    '- 4-32 characters each, max 64',
    '- Each line must differ in tone and wording',
    `- Example tone (do not copy): ${examples}`,
    '- Light sarcasm OK; no hate or slurs',
    slangHint(language),
    avoidBlock(language, avoidRecent),
    personaHint(context, language),
    '',
    formatContextBlock(context),
  ]
    .filter(Boolean)
    .join('\n')
}

/** Ultra-minimal third attempt for small models. */
export function buildCommentMinimalPrompt(
  context: PageContext,
  count: number,
  language: ResolvedLanguage,
): string {
  const lang = languageName(language)
  const title = context.title.slice(0, 80)
  const visible = context.viewportText.slice(0, 400)
  return [
    `${count} short ${lang} comments about this page.`,
    'One per line. No numbering. Max 48 chars each.',
    `Title: ${title}`,
    visible ? `Text: ${visible}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Retry keeps the same structure with a stricter footer. */
export function buildCommentRetryPrompt(
  context: PageContext,
  count: number,
  language: ResolvedLanguage,
  avoidRecent: string[] = [],
): string {
  const footer =
    language === 'ja'
      ? `ちょうど${count}行だけ。他は何も書かない。`
      : language === 'en'
        ? `Reply with exactly ${count} lines. Nothing else.`
        : `只输出${count}行，不要其他内容。`
  return [
    buildCommentPrompt(context, count, language, avoidRecent),
    '',
    footer,
  ].join('\n')
}
