import { useCallback, useState } from 'react'

import {
  getOAuth2Token,
  OAUTH2_CLIENT_ID,
  updateSelf,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import type { OAuth2TokenResponse } from '@opentrons/api-client'

export interface UseSetNewPasswordAndSignInOptions {
  onSuccess: (username: string, response: OAuth2TokenResponse) => void
  onError: () => void
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
  const host = useHost()
  const [isLoading, setIsLoading] = useState(false)

  const submitNewPassword = useCallback(
    (username: string, password: string): void => {
      if (host?.token == null) {
        console.error('useSetNewPasswordAndSignIn: missing host token')
        onError()
        return
      }

      setIsLoading(true)
      void (async () => {
        try {
          try {
            await updateSelf(host, { data: { password } })
          } catch (error) {
            console.error(
              'useSetNewPasswordAndSignIn: failed to update password',
              error
            )
            onError()
            return
          }

          const tokenResponse = await getOAuth2Token(host, {
            grant_type: 'password',
            username,
            password,
            client_id: OAUTH2_CLIENT_ID,
          })
          onSuccess(username, tokenResponse.data)
        } catch (error) {
          console.error('useSetNewPasswordAndSignIn: failed to sign in', error)
          onError()
        } finally {
          setIsLoading(false)
        }
      })()
    },
    [host, onError, onSuccess]
  )

  return {
    submitNewPassword,
    isLoading,
  }
}
