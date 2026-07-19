export { sanitizeCommentText } from '@/shared/safety'

export function looksLikeStructuredComments(raw: string): boolean {
  return raw.includes('[') && raw.includes('{') && raw.includes('text')
}
