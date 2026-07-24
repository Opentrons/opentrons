import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { logIn, type LoggedInUserProfile } from '/app/redux/robot-auth'

import type { OAuth2TokenResponse } from '@opentrons/api-client'

/** Returns a function that updates client-side state to reflect a successful login. */
export function useStoreLoginState(): (
  robotName: string | null,
  user: LoggedInUserProfile,
  successfulLoginResponse: OAuth2TokenResponse
) => void {
  const dispatch = useDispatch()

  const storeLoginState = useCallback(
    (
      robotName: string | null,
      user: LoggedInUserProfile,
      successfulLoginResponse: OAuth2TokenResponse
    ): void => {
      if (robotName == null) {
        console.warn("Couldn't identify the robot to log in to.")
        return
      }
      if (successfulLoginResponse.token_type !== 'Bearer') {
        console.warn(
          'The server gave us an unrecognized token type:',
          successfulLoginResponse.token_type
        )
        return
      }

      dispatch(
        logIn({
          username: user.username,
          fullName: user.fullName,
          accountType: user.accountType,
          robotName,
          accessToken: successfulLoginResponse.access_token,
          refreshToken: successfulLoginResponse.refresh_token ?? null,
          expiresAt:
            successfulLoginResponse.expires_in == null
              ? null
              : Date.now() + successfulLoginResponse.expires_in * 1000,
        })
      )
    },
    [dispatch]
  )

  return storeLoginState
}
