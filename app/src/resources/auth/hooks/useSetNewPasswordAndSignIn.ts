import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  getOAuth2Token,
  OAUTH2_CLIENT_ID,
  updateSelf,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { getOAuth2LoginErrorMessage } from './getOAuth2LoginErrorMessage'

import type { TFunction } from 'i18next'
import type { OAuth2TokenResponse } from '@opentrons/api-client'

export interface UseSetNewPasswordAndSignInOptions {
  onSuccess: (username: string, response: OAuth2TokenResponse) => void
  onError: (message: string) => void
}

interface UseSetNewPasswordAndSignInResult {
  submitNewPassword: (username: string, password: string) => void
  isLoading: boolean
}

/**
 * For the choose-new-password step after the user has already signed in with a
 * temporary password and holds a valid access token.
 *
 * Submits the chosen password via `PATCH /auth/users/self`, then signs in again
 * with that password so client auth state matches the new credentials.
 */
export function useSetNewPasswordAndSignIn(
  options: UseSetNewPasswordAndSignInOptions
): UseSetNewPasswordAndSignInResult {
  const { onSuccess, onError } = options
  const { t } = useTranslation('access_control') as { t: TFunction }
  const host = useHost()
  const [isLoading, setIsLoading] = useState(false)

  const submitNewPassword = useCallback(
    (username: string, password: string): void => {
      if (host == null || host.token == null) {
        console.error('useSetNewPasswordAndSignIn: missing host token')
        onError(t('login_error_incorrect') as string)
        return
      }

      setIsLoading(true)
      void (async () => {
        try {
          try {
            // ok so usually using react-api-client functions outside of mutations is bad
            // but here, we need to specifically not ask for documentation as were in the middle of login
            // eslint-disable-next-line opentrons/no-direct-mutating
            await updateSelf(host, { data: { password } }, '')
          } catch (error) {
            console.error(
              'useSetNewPasswordAndSignIn: failed to update password',
              error
            )
            onError(t('set_new_password_error_update_failed') as string)
            return
          }

          // eslint-disable-next-line opentrons/no-direct-mutating
          const tokenResponse = await getOAuth2Token(host, {
            grant_type: 'password',
            username,
            password,
            client_id: OAUTH2_CLIENT_ID,
          })
          onSuccess(username, tokenResponse.data)
        } catch (error) {
          console.error('useSetNewPasswordAndSignIn: failed to sign in', error)
          onError(getOAuth2LoginErrorMessage(error, t))
        } finally {
          setIsLoading(false)
        }
      })()
    },
    [host, onError, onSuccess, t]
  )

  return {
    submitNewPassword,
    isLoading,
  }
}
