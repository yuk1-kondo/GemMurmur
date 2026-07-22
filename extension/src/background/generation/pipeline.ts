import { GENERATION, INTERACTION, QUEUE } from '@/shared/constants'
import { resolveLanguage } from '@/shared/language'
import { pageKeyFromUrl } from '@/shared/page-key'
import { CommentTextLedger } from '@/shared/text-dedup'
import { USER_MESSAGES } from '@/shared/user-messages'
import type { BuzzState, CommentDraft, ModelState, MurmurSettings, PageContext, ResolvedLanguage } from '@/shared/types'
import { broadcastToPage } from '../broadcast'
import { sendToOffscreen } from '../offscreen-rpc'
import { parseGeneratedComments } from '../parse-comments'
import {
  buildBuzzMinimalPrompt,
  buildBuzzPrompt,
  buildCommentMinimalPrompt,
  buildCommentPrompt,
} from '../prompt'

export interface GenerationDeps {
  getSettings: () => MurmurSettings
  getBuzz: () => BuzzState
  getModel: () => ModelState
  ensureModelRuntime: () => Promise<boolean>
  onFatalModelError: (message: string) => Promise<void>
}

const pageCommentLedgers = new Map<string, CommentTextLedger>()
let generating = false
const pendingQueue: Array<{ context: PageContext; count: number }> = []
let gemmaBackoffUntil = 0
let gemmaFailStreak = 0
let showingThinking = false

const MAX_PENDING = 4

function ledgerForPage(pageKey: string): CommentTextLedger {
  let ledger = pageCommentLedgers.get(pageKey)
  if (!ledger) {
    ledger = new CommentTextLedger(INTERACTION.sameTextCooldownMs)
    pageCommentLedgers.set(pageKey, ledger)
    if (pageCommentLedgers.size > 48) {
      const oldest = pageCommentLedgers.keys().next().value
      if (oldest) pageCommentLedgers.delete(oldest)
    }
  }
  return ledger
}

export function filterUniqueComments(comments: CommentDraft[], pageKey: string): CommentDraft[] {
  const ledger = ledgerForPage(pageKey)
  const unique: CommentDraft[] = []
  for (const comment of comments) {
    if (!comment.isBuzz && ledger.has(comment.text)) continue
    if (!comment.isBuzz) ledger.add(comment.text)
    unique.push(comment)
  }
  return unique
}

function enqueuePending(context: PageContext, count: number): void {
  const key = pageKeyFromUrl(context.url)
  const filtered = pendingQueue.filter((item) => pageKeyFromUrl(item.context.url) !== key)
  filtered.push({ context, count })
  while (filtered.length > MAX_PENDING) filtered.shift()
  pendingQueue.length = 0
  pendingQueue.push(...filtered)
}

async function deliverComments(
  comments: CommentDraft[],
  targetPageKey: string,
): Promise<void> {
  const gemmaOnly = comments.filter((c) => c.source === 'gemma')
  const unique = filterUniqueComments(gemmaOnly, targetPageKey)
  if (unique.length === 0) return
  await broadcastToPage(targetPageKey, {
    type: 'COMMENTS',
    comments: unique,
    pageKey: targetPageKey,
  })
}

async function runGemmaGenerate(
  context: PageContext,
  count: number,
  language: ResolvedLanguage,
  pageKey: string,
  isBuzz: boolean,
): Promise<CommentDraft[]> {
  const batch = Math.min(count, isBuzz ? GENERATION.buzzBatchCap : GENERATION.gemmaBatchCap)
  const requestId = `gen_${Date.now()}`
  const avoidRecent = ledgerForPage(pageKey).recentTexts(12)
  const started = performance.now()

  const tryGenerate = async (prompt: string): Promise<string | null> => {
    const result = (await sendToOffscreen({
      type: 'OFFSCREEN_GENERATE',
      prompt,
      requestId: `${requestId}_${Math.random().toString(36).slice(2, 6)}`,
    })) as { text?: string | null; error?: string }
    if (result?.error) throw new Error(result.error)
    return result?.text ?? null
  }

  let raw = await tryGenerate(
    isBuzz
      ? buildBuzzPrompt(batch, language)
      : buildCommentPrompt(context, batch, language, avoidRecent),
  )
  let parsed = parseGeneratedComments(raw ?? '', language, isBuzz ? undefined : context, batch)
  if (isBuzz) {
    parsed = parsed.map((comment) => ({
      ...comment,
      isBuzz: true,
      category: 'crowd',
      emotion: 'amused',
      emphasis: 0.7 + Math.random() * 0.3,
    }))
  }
  if (parsed.length > 0) {
    console.info(`GemMurmur: Gemma inference ${Math.round(performance.now() - started)}ms`)
    return parsed
  }

  try {
    raw = await tryGenerate(
      isBuzz
        ? buildBuzzMinimalPrompt(batch, language)
        : buildCommentMinimalPrompt(context, batch, language),
    )
    parsed = parseGeneratedComments(raw ?? '', language, isBuzz ? undefined : context, batch)
    if (isBuzz) {
      parsed = parsed.map((comment) => ({
        ...comment,
        isBuzz: true,
        category: 'crowd',
        emotion: 'amused',
        emphasis: 0.7 + Math.random() * 0.3,
      }))
    }
    if (parsed.length > 0) {
      console.info(`GemMurmur: Gemma minimal inference ${Math.round(performance.now() - started)}ms`)
    }
  } catch (retryError) {
    console.warn('GemMurmur: Gemma minimal retry failed:', retryError)
  }
  return parsed
}

export async function generateForContext(
  context: PageContext,
  count: number,
  deps: GenerationDeps,
): Promise<void> {
  if (generating) {
    enqueuePending(context, count)
    return
  }

  const settings = deps.getSettings()
  const model = deps.getModel()
  if (context.isPrivate) return
  if (!settings.enabled || settings.paused) return

  const language = resolveLanguage(settings.language, context.language)
  const isBuzz = settings.buzzMode || deps.getBuzz().density === 'buzz'
  const batch = Math.min(count, isBuzz ? GENERATION.buzzBatchCap : QUEUE.batchSize)
  const targetPageKey = pageKeyFromUrl(context.url)

  if (model.status !== 'ready') {
    if (model.status === 'idle' || model.status === 'deleted' || model.status === 'error') {
      void deps.ensureModelRuntime()
    }
    return
  }

  if (Date.now() < gemmaBackoffUntil) return

  generating = true
  if (!showingThinking) {
    showingThinking = true
    await broadcastToPage(targetPageKey, {
      type: 'SHOW_STATUS',
      message: USER_MESSAGES.gemmaThinking,
      level: 'info',
      placement: 'corner',
    })
  }

  try {
    const parsed = await runGemmaGenerate(context, batch, language, targetPageKey, isBuzz)
    await broadcastToPage(targetPageKey, { type: 'CLEAR_STATUS' })
    showingThinking = false

    if (parsed.length === 0) {
      gemmaFailStreak += 1
      gemmaBackoffUntil = Date.now() + Math.min(60_000, 8_000 * gemmaFailStreak)
      console.warn('GemMurmur: Gemma produced no usable comments')
      return
    }

    gemmaFailStreak = 0
    gemmaBackoffUntil = 0
    await deliverComments(parsed, targetPageKey)
  } catch (error) {
    await broadcastToPage(targetPageKey, { type: 'CLEAR_STATUS' })
    showingThinking = false
    const message = error instanceof Error ? error.message : String(error)
    gemmaFailStreak += 1
    gemmaBackoffUntil = Date.now() + Math.min(60_000, 8_000 * gemmaFailStreak)

    if (/busy|not ready|webgpu/i.test(message)) {
      await deps.onFatalModelError(message)
    } else {
      console.warn('GemMurmur: Gemma generation failed:', message)
    }
  } finally {
    generating = false
    const next = pendingQueue.shift()
    if (next) void generateForContext(next.context, next.count, deps)
  }
}
