import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  useHost,
  useResetSelfPasswordMutation,
} from '@opentrons/react-api-client'

import { getLocalRobotAccessToken } from '/app/redux/robot-auth'

import { useOAuth2PasswordLogin } from './useOAuth2PasswordLogin'

import type { OAuth2TokenResponse } from '@opentrons/api-client'

export interface UseUpdateNewPasswordOptions {
  onSuccess: (username: string, response: OAuth2TokenResponse) => void
  onError: (message: string) => void
}

interface UseUpdateNewPasswordResult {
  updateNewPassword: (username: string, password: string) => void
  isLoading: boolean
}

/**
 * After logging in with a temporary password, set a new password via
 * `POST /auth/users/self/resetPassword`, then sign in with the new password.
 */
export function useUpdateNewPassword(
  options: UseUpdateNewPasswordOptions
): UseUpdateNewPasswordResult {
  const { onSuccess, onError } = options
  const host = useHost()
  const accessToken = useSelector(getLocalRobotAccessToken)

  const hostWithToken = useMemo(
    () =>
      host != null && accessToken != null
        ? { ...host, token: accessToken }
        : null,
    [accessToken, host]
  )

  const { resetSelfPassword, isLoading: isResetLoading } =
    useResetSelfPasswordMutation({}, hostWithToken)

  const { submitPassword, isAuthLoading: isOAuthLoading } =
    useOAuth2PasswordLogin({
      onSuccess: (
        username,
        _accessToken,
        _userMustSetNewPassword,
        response
      ) => {
        onSuccess(username, response)
      },
      onError,
    })

  const updateNewPassword = useCallback(
    (username: string, password: string): void => {
      if (hostWithToken == null) {
        onError('Not signed in.')
        return
      }

      void resetSelfPassword({ data: { password } })
        .then(() => {
          submitPassword(username, password)
        })
        .catch(() => {
          onError('Failed to update password.')
        })
    },
    [hostWithToken, onError, resetSelfPassword, submitPassword]
  )

  return { updateNewPassword, isLoading: isResetLoading || isOAuthLoading }
}
