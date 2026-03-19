import type { ApiErrorResponse } from '../types'

export const isApiErrorResponse = (
  value: unknown
): value is ApiErrorResponse => {
  if (value == null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.message === 'string' && typeof record.error_type === 'string'
  )
}
