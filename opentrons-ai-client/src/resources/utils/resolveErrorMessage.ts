import type { TFunction } from 'i18next'
import type { ApiErrorResponse } from '../types'

/** Maps server errorType values to i18n keys. Types not listed fall back to the raw server message. */
const ERROR_TYPE_I18N_KEY: Record<string, string> = {
  context_length_exceeded: 'error_context_length',
  RateLimitError: 'error_rate_limit',
  APITimeoutError: 'error_timeout',
  request_timeout: 'error_timeout',
  APIConnectionError: 'error_connection',
  network_error: 'error_connection',
  unknown: 'error_generic',
  BadRequestError: 'error_generic',
  APIStatusError: 'error_generic',
  InternalServerError: 'error_generic',
}

export function resolveErrorMessage(
  error: ApiErrorResponse | null,
  t: TFunction
): string | null {
  if (error == null) return null
  const i18nKey = ERROR_TYPE_I18N_KEY[error.errorType]
  return i18nKey != null ? t(i18nKey) : error.message
}
