import axios from 'axios'

import type { TFunction } from 'i18next'

/**
 * Shape of an error response from `POST /auth/oauth2/token`: the standard
 * RFC 6749 § 5.2 fields plus the opentrons-specific
 * `opentrons_login_attempts_remaining` field returned when the lockout limit is configured. `opentrons_account_locked` field returned when the account is locked by an admin.
 */
interface OAuth2TokenErrorResponse {
  error?: string
  error_description?: string
  opentrons_login_attempts_remaining?: number
  opentrons_account_locked?: boolean
}

export function getOAuth2LoginErrorMessage(
  error: unknown,
  t: TFunction
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as OAuth2TokenErrorResponse | undefined
    const oauth2ErrorCode = data?.error
    const attemptsRemaining = data?.opentrons_login_attempts_remaining
    const accountLocked = data?.opentrons_account_locked === true
    if (oauth2ErrorCode === 'invalid_grant') {
      if (accountLocked || attemptsRemaining === 0) {
        return t('login_error_locked')
      } else if (typeof attemptsRemaining === 'number') {
        return t('login_error_incorrect_with_attempts_remaining', {
          attemptsRemaining,
        })
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
