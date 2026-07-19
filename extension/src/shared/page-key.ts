/** Stable page identity for queue invalidation (fragment stripped). */
export function pageKeyFromUrl(url: string): string {
  return url.split('#')[0]
}
