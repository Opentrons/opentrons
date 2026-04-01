import type { ApiErrorResponse } from '../types'

/** API returns camelCase; guard for message + errorType. */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (value == null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.message === 'string' && typeof record.errorType === 'string'
  )
}
