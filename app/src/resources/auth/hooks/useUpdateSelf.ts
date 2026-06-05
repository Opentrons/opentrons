import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useHost, useUpdateSelfMutation } from '@opentrons/react-api-client'

import { getLocalRobotAccessToken } from '/app/redux/robot-auth'

import { useOAuth2PasswordLogin } from './useOAuth2PasswordLogin'

import type { OAuth2TokenResponse } from '@opentrons/api-client'

export interface UseUpdateSelfOptions {
  onSuccess: (username: string, response: OAuth2TokenResponse) => void
  onError: (message: string) => void
}

interface UseUpdateSelfResult {
  updateSelf: (username: string, password: string) => void
  isLoading: boolean
}

/**
 * After logging in with a temporary password, set a new password via
 * `PATCH /auth/users/self`, then sign in with the new password.
 */
export function useUpdateSelf(
  options: UseUpdateSelfOptions
): UseUpdateSelfResult {
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

  const { updateSelf: patchSelf, isLoading: isPatchSelfLoading } =
    useUpdateSelfMutation({}, hostWithToken)

  const { submitPassword, isAuthLoading: isOAuthLoading } =
    useOAuth2PasswordLogin({
      onSuccess: (username, _accessToken, _user, response) => {
        onSuccess(username, response)
      },
      onError,
    })

  const updateSelf = useCallback(
    (username: string, password: string): void => {
      if (hostWithToken == null) {
        onError('Not signed in.')
        return
      }

      void patchSelf({ data: { password } })
        .then(() => {
          submitPassword(username, password)
        })
        .catch(() => {
          onError('Failed to update password.')
        })
    },
    [hostWithToken, onError, patchSelf, submitPassword]
  )

  return {
    updateSelf,
    isLoading: isPatchSelfLoading || isOAuthLoading,
  }
}
