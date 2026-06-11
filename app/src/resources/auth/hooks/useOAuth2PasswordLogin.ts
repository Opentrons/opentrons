import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getSelf, OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation, useHost } from '@opentrons/react-api-client'

import { getOAuth2LoginErrorMessage } from './getOAuth2LoginErrorMessage'

import type { TFunction } from 'i18next'
import type {
  AuthUser,
  OAuth2TokenResponse,
  ROPCRequest,
} from '@opentrons/api-client'

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
  const { t } = useTranslation('access_control') as { t: TFunction }
  const host = useHost()
  const [isFetchingSelf, setIsFetchingSelf] = useState(false)

  const { getOAuth2Token, isLoading: isOAuthLoading } =
    useGetOAuth2TokenMutation({
      onSuccess: (responseData, requestVariables) => {
        const response = responseData.data
        const accessToken = response.access_token as string
        const { username } = requestVariables as ROPCRequest

        if (host == null) {
          onError(t('login_error_incorrect') as string)
          return
        }

        setIsFetchingSelf(true)
        void getSelf({ ...host, token: accessToken })
          .then(selfResponse => {
            onSuccess(username, selfResponse.data.data, response)
          })
          .catch(() => {
            onError(t('login_error_incorrect') as string)
          })
          .finally(() => {
            setIsFetchingSelf(false)
          })
      },
      onError: (error: unknown) => {
        onError(getOAuth2LoginErrorMessage(error, t))
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
