import axios from 'axios'

import type { TFunction } from 'i18next'

/**
 * Shape of an error response from `POST /auth/oauth2/token`: the standard
 * RFC 6749 § 5.2 fields plus the opentrons-specific
 * `opentrons_login_attempts_remaining` field returned when the lockout limit
 * is configured.
 */
interface OAuth2TokenErrorResponse {
  error?: string
  error_description?: string
  opentrons_login_attempts_remaining?: number
}

export function getOAuth2LoginErrorMessage(
  error: unknown,
  t: TFunction
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as OAuth2TokenErrorResponse | undefined
    const oauth2ErrorCode = data?.error
    const attemptsRemaining = data?.opentrons_login_attempts_remaining
    if (oauth2ErrorCode === 'invalid_grant') {
      if (typeof attemptsRemaining === 'number') {
        if (attemptsRemaining === 0) {
          return t('login_error_locked')
        } else {
          return t('login_error_incorrect_with_attempts_remaining', {
            attemptsRemaining,
          })
        }
      } else {
        return t('login_error_incorrect')
      }
    } else {
      return t('login_error_unknown_with_message', { message: error.message })
    }
  } else {
    return t('login_error_unknown')
  }
}
