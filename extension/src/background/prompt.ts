import { LANGUAGE_NAMES } from '@/shared/language'
import { personaBias } from '@/shared/personas'
import { pickSlangBatch } from '@/shared/rule-comments/pools'
import type { PageContext, ResolvedLanguage } from '@/shared/types'

const STYLE_ANGLES: Partial<Record<ResolvedLanguage, readonly string[]>> = {
  ja: [
    'ツッコミ・共感・軽い皮肉を混ぜる。語尾は毎回変える。',
    '断定・感想多め。「それな」「ええやん」「強すぎ」系。',
    '共感多め。「わかる」「草」「うける」系。疑問語尾は少なめ。',
    '懐疑的に。でも「なの？」連発は禁止。「本当か」「ソースどこ」など言い方を散らす。',
    'ネットスラング多め。短く言い切る。',
    '技術読者っぽく。比較・スペック・使い勝手に触れる。語尾をバラす。',
  ],
  en: [
    'Mix tsukkomi, empathy, skeptical questions, and light sarcasm. Vary endings.',
    'Curious crowd: ask short questions, but do not reuse the same question pattern.',
    'Supportive crowd: agree, relate, and react emotionally.',
    'Skeptical crowd: doubt claims, ask for sources, poke holes gently.',
    'Casual chat: internet slang, jokes, and offhand reactions.',
    'Technical readers: note details, compare, or nitpick lightly.',
  ],
  'zh-Hans': [
    '混合吐槽、共鸣和轻微讽刺。句尾要有变化。',
    '短问可以，但不要反复同一种疑问句式。',
    '共鸣为主，像弹幕聊天。',
    '怀疑态度，要求来源或证据。',
    '网络用语多，口语化。',
    '技术读者风格，关注细节。',
  ],
  'zh-Hant': [
    '混合吐槽、共鳴和輕微諷刺。句尾要有變化。',
    '短問可以，但不要反覆同一種疑問句式。',
    '共鳴為主，像彈幕聊天。',
    '懷疑態度，要求來源或證據。',
    '網路用語多，口語化。',
    '技術讀者風格，關注細節。',
  ],
}

const EXAMPLE_LINES: Partial<Record<ResolvedLanguage, string[]>> = {
  ja: [
    'なるほど',
    'それで？',
    'マジか',
    '強すぎだろ',
    'それな',
    'ええやん',
    '草',
    '神',
    'ほんとかよ',
    'スペック見たい',
    'www',
    'ｷﾀ━━(ﾟ∀ﾟ)━━!!',
  ],
  en: ['huh', 'wait what', 'source?', 'fair point', 'lol', 'based', 'W', 'too good'],
  'zh-Hans': ['真的假的', '所以呢', '来源呢', '有点东西', '2333', 'yyds', '绝了', '太强了'],
  'zh-Hant': ['真的假的', '所以呢', '來源呢', '有點東西', '2333', 'yyds', '絕了', '太強了'],
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

/**
 * Small models latch onto one polite question ending (esp. 「なの？」 on tech pages).
 * Force ending diversity in the prompt itself.
 */
function endingVarietyHint(language: ResolvedLanguage): string {
  switch (language) {
    case 'ja':
      return [
        '- 語尾を必ずバラす。同じ語尾を2回以上使わない',
        '- 「なの？」「なんですか？」「でしょうか？」の連発は禁止（バッチ内で最大1回）',
        '- 語尾の例を混ぜる: だろ / やん / わ / ぞ / ね / かよ / すぎ / 草 / それな / マジか / で？ / は？ / 言い切り（語尾なし）',
      ].join('\n')
    case 'zh-Hans':
      return '- 句尾要多样化，不要反复同一种「吗？/呢？」疑问结尾'
    case 'zh-Hant':
      return '- 句尾要多樣化，不要反覆同一種「嗎？/呢？」疑問結尾'
    default:
      return '- Vary sentence endings; do not reuse the same question pattern (e.g. ending every line with "?")'
  }
}

function personaHint(context: PageContext, language: ResolvedLanguage): string {
  const voices = personaBias(context.kind, language).join(', ')
  if (language === 'ja') return `観客の雰囲気: ${voices}`
  if (language === 'en') return `Crowd vibe: ${voices}`
  return `观众氛围: ${voices}`
}

function languageName(lang: ResolvedLanguage): string {
  return LANGUAGE_NAMES[lang]
}

function pickStyleAngle(language: ResolvedLanguage): string {
  const pool = STYLE_ANGLES[language] ?? STYLE_ANGLES.en!
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
  const examples = (EXAMPLE_LINES[language] ?? EXAMPLE_LINES.en!).join(' / ')
  return [
    `Write exactly ${count} short live-audience comments in ${lang} only.`,
    `Style: ${angle}`,
    reactionRule(language),
    'Rules:',
    '- One comment per line',
    '- No numbering, bullets, JSON, or quotes',
    '- 4-32 characters each, max 64',
    '- Each line must differ in tone, wording, and sentence ending',
    `- Example tone (do not copy): ${examples}`,
    '- Light sarcasm OK; no hate or slurs',
    slangHint(language),
    endingVarietyHint(language),
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
  const ending =
    language === 'ja'
      ? '語尾をバラす。「なの？」連発禁止。'
      : 'Vary endings; do not repeat one question pattern.'
  return [
    `${count} short ${lang} comments about this page.`,
    'One per line. No numbering. Max 48 chars each.',
    ending,
    `Title: ${title}`,
    visible ? `Text: ${visible}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Buzz is a global party overlay, not a reaction to the page beneath it.
 * Keep the prompt context-free so no site content leaks into the celebration.
 */
export function buildBuzzPrompt(count: number, language: ResolvedLanguage): string {
  const lang = languageName(language)
  const examples = pickSlangBatch(language, Math.min(12, count)).join(' / ')
  return [
    `Write exactly ${count} very short internet crowd reactions in ${lang} only.`,
    'This is a joyful full-screen celebration flood. Ignore the web page completely.',
    'Do not mention, summarize, answer, or infer anything about the page.',
    'Rules:',
    '- One reaction per line',
    '- No numbering, bullets, JSON, quotes, explanations, or hashtags',
    '- 2-28 characters each; make every line different',
    '- Use broadly understood local online slang, cheers, laughter, emoji, and reaction fragments',
    '- Keep it playful and inclusive: no hate, slurs, sexual content, threats, or targeted insults',
    `- Local vibe examples (do not copy every one): ${examples}`,
    'Output only the reactions.',
  ].join('\n')
}

/** A terse retry for the on-device model if the primary Buzz output is malformed. */
export function buildBuzzMinimalPrompt(count: number, language: ResolvedLanguage): string {
  const lang = languageName(language)
  return [
    `${count} short happy internet-slang reactions in ${lang}.`,
    'Ignore the web page. One per line. No numbering. No explanations. Safe and playful only.',
  ].join('\n')
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
