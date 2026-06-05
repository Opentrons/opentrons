import { useState } from 'react'
import axios from 'axios'

import { getSelf, OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation, useHost } from '@opentrons/react-api-client'

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
   * Called with an `access_control` i18n key when the token request fails.
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
  const host = useHost()
  const [isFetchingSelf, setIsFetchingSelf] = useState(false)

  const getOAuthTokenErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as OAuth2TokenErrorResponse | undefined
      const oauth2ErrorCode = data?.error
      const attemptsRemaining = data?.opentrons_login_attempts_remaining
      if (oauth2ErrorCode === 'invalid_grant') {
        if (typeof attemptsRemaining === 'number') {
          if (attemptsRemaining === 0) {
            return 'login_error_locked'
          } else {
            return 'login_error_incorrect_with_attempts_remaining'
          }
        } else {
          return 'login_error_incorrect'
        }
      } else {
        return 'login_error_unknown_with_message'
      }
    } else {
      return 'login_error_unknown'
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
          onError('login_error_incorrect')
          return
        }

        setIsFetchingSelf(true)
        void getSelf({ ...host, token: accessToken })
          .then(selfResponse => {
            onSuccess(username, selfResponse.data.data, response)
          })
          .catch(() => {
            onError('login_error_incorrect')
          })
          .finally(() => {
            setIsFetchingSelf(false)
          })
      },
      onError: (error: unknown) => {
        onError(getOAuthTokenErrorMessage(error))
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
