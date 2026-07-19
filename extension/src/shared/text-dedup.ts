/** Normalize comment text for duplicate detection across sources. */
export function normalizeCommentKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[！!？?。．、,，.…・「」『』（）()［］[\]]/g, '')
}

/** Loose match for near-duplicate phrases (not just exact). */
export function isSimilarComment(a: string, b: string): boolean {
  const na = normalizeCommentKey(a)
  const nb = normalizeCommentKey(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const shorter = na.length <= nb.length ? na : nb
  const longer = na.length <= nb.length ? nb : na
  if (shorter.length >= 4 && longer.includes(shorter)) return true
  if (shorter.length >= 6 && na.slice(0, 6) === nb.slice(0, 6)) return true
  return false
}

export class CommentTextLedger {
  private seen = new Map<string, number>()
  private recent: string[] = []

  constructor(private ttlMs: number) {}

  has(text: string): boolean {
    this.prune()
    const key = normalizeCommentKey(text)
    if (this.seen.has(key)) return true
    return this.recent.some((item) => isSimilarComment(item, text))
  }

  add(text: string): void {
    const key = normalizeCommentKey(text)
    const now = Date.now()
    this.seen.set(key, now)
    this.recent.push(text)
    if (this.recent.length > 24) this.recent = this.recent.slice(-24)
    this.prune()
  }

  recentTexts(limit = 12): string[] {
    this.prune()
    return this.recent.slice(-limit)
  }

  clear(): void {
    this.seen.clear()
    this.recent = []
  }

  private prune(): void {
    const now = Date.now()
    for (const [key, at] of this.seen) {
      if (now - at > this.ttlMs) this.seen.delete(key)
    }
    if (this.recent.length > 24) this.recent = this.recent.slice(-24)
  }
}
