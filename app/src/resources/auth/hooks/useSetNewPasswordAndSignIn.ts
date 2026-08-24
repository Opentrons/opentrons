import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { updateSelf } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { mapSetNewPasswordError } from '../mapAuthUserMutationError'

import type { TFunction } from 'i18next'

export interface UseSetNewPasswordAndSignInOptions {
  onSuccess: (username: string) => void
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
 * Submits the chosen password via `PATCH /auth/users/self`. Callers should then
 * return the user to the login screen so they can sign in with the new password.
 */
export function useSetNewPasswordAndSignIn(
  options: UseSetNewPasswordAndSignInOptions
): UseSetNewPasswordAndSignInResult {
  const { onSuccess, onError } = options
  const { t } = useTranslation(['device_settings', 'access_control']) as {
    t: TFunction
  }
  const host = useHost()
  const [isLoading, setIsLoading] = useState(false)

  const submitNewPassword = useCallback(
    (username: string, password: string): void => {
      if (host == null || host.token == null) {
        console.error('useSetNewPasswordAndSignIn: missing host token')
        onError(
          t('set_new_password_error_session_expired', {
            ns: 'access_control',
          })
        )
        return
      }

      setIsLoading(true)
      void (async () => {
        try {
          // ok so usually using react-api-client functions outside of mutations is bad
          // but here, we need to specifically not ask for documentation as were in the middle of login
          // eslint-disable-next-line opentrons/no-direct-mutating
          await updateSelf(host, { data: { password } }, '')
          onSuccess(username)
        } catch (error) {
          console.error(
            'useSetNewPasswordAndSignIn: failed to update password',
            error
          )
          onError(mapSetNewPasswordError(error, t))
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
