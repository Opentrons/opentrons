import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import {
  isDocumentedMutationError,
  useHost,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { mapSetNewPasswordError } from '../mapAuthUserMutationError'

import type { TFunction } from 'i18next'
import type { DocumentationState } from '@opentrons/react-api-client'

export interface UseSetNewPasswordAndSignInOptions {
  onSuccess: (username: string, password: string) => void
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
 * sign the user in again with the new password so they receive a full-scope token.
 */
export function useSetNewPasswordAndSignIn(
  documentationState: DocumentationState,
  options: UseSetNewPasswordAndSignInOptions
): UseSetNewPasswordAndSignInResult {
  const { onSuccess, onError } = options
  const { t } = useTranslation(['device_settings', 'access_control']) as {
    t: TFunction
  }
  const host = useHost()
  const { updateSelf, isLoading } = useUpdateSelfMutation(documentationState)

  const submitNewPassword = useCallback(
    (username: string, password: string): void => {
      if (host?.token == null) {
        console.error('useSetNewPasswordAndSignIn: missing host token')
        onError(
          t('set_new_password_error_session_expired', {
            ns: 'access_control',
          })
        )
        return
      }

      void updateSelf({ data: { password } })
        .then(() => {
          onSuccess(username, password)
        })
        .catch((error: unknown) => {
          if (isDocumentedMutationError(error)) {
            return
          }
          console.error(
            'useSetNewPasswordAndSignIn: failed to update password',
            error
          )
          onError(mapSetNewPasswordError(error, t))
        })
    },
    [host, onError, onSuccess, t, updateSelf]
  )

  return {
    submitNewPassword,
    isLoading,
  }
}
