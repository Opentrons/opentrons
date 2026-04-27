/**
 * Validates a post-login path. Only same-app paths (must start with `/`, not `//`).
 */
export function getSafePostLoginPath(from: string | undefined): string | null {
  if (from == null || from === '') return null
  if (!from.startsWith('/') || from.startsWith('//')) return null
  return from
}
