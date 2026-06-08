import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

import { getSelf, OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation, useHost } from '@opentrons/react-api-client'

import type { TFunction } from 'i18next'
import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'

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

function getReloginErrorMessage(t: TFunction): string {
  return t('login_error_incorrect') as string
}

export interface UseOAuth2PasswordLoginOptions {
  /**
   * Called after OAuth login succeeds and `GET /auth/users/self` completes.
   */
  onSuccess: (
    username: string,
    user: AuthUser,
    response: OAuth2TokenResponse
  ) => void
  /**
   * Called with a user-facing message when the token request fails.
   */
  onError: (message: string) => void
}

interface UseOAuth2PasswordLoginResult {
  submitPassword: (username: string, password: string) => void
  isAuthLoading: boolean
}

/**
 * Resource-owner password OAuth2 flow against `POST /auth/oauth2/token`
 * on the same base URL as the robot API (`ApiHostProvider` hostname/port).
 * Must run under `ApiHostProvider` so `useGetOAuth2TokenMutation` resolves the host.
 *
 * After a successful token response, fetches `GET /auth/users/self`.
 */
export function useOAuth2PasswordLogin(
  options: UseOAuth2PasswordLoginOptions
): UseOAuth2PasswordLoginResult {
  const { onSuccess, onError } = options
  const { t } = useTranslation('access_control')
  const host = useHost()
  const [isFetchingSelf, setIsFetchingSelf] = useState(false)

  const getErrorMessage = (error: unknown): string => {
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

  const { getOAuth2Token, isLoading: isOAuthLoading } =
    useGetOAuth2TokenMutation({
      onSuccess: (responseData, requestVariables) => {
        if (requestVariables.grant_type !== 'password') {
          // Shouldn't happen since this hook only sends request with grant_type==='password'.
          console.warn(
            'Expected grant_type password, got',
            requestVariables.grant_type
          )
          return
        }

        const response = responseData.data
        const accessToken = response.access_token as string
        const username = requestVariables.username

        if (host == null) {
          onError(getReloginErrorMessage(t))
          return
        }

        setIsFetchingSelf(true)
        void getSelf({ ...host, token: accessToken })
          .then(selfResponse => {
            onSuccess(username, selfResponse.data.data, response)
          })
          .catch(() => {
            onError(getReloginErrorMessage(t))
          })
          .finally(() => {
            setIsFetchingSelf(false)
          })
      },
      onError: (error: unknown) => {
        onError(getErrorMessage(error))
      },
    })

  const submitPassword = (username: string, password: string): void => {
    getOAuth2Token({
      grant_type: 'password',
      username,
      password,
      client_id: OAUTH2_CLIENT_ID,
    })
  }

  return { submitPassword, isAuthLoading: isOAuthLoading || isFetchingSelf }
}
