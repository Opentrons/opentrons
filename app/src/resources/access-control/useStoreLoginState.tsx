import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getLocalRobot } from '/app/redux/discovery'
import { logIn } from '/app/redux/robot-auth'

import type { OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

/** Returns a function that updates client-side state to reflect a successful login. */
export function useStoreLoginState(): (
  username: string,
  successfulLoginResponse: OAuth2TokenResponse
) => void {
  const dispatch = useDispatch()

  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )

  const storeLoginState = useCallback(
    (username: string, successfulLoginResponse: OAuth2TokenResponse): void => {
      if (localRobotName == null) {
        console.warn("Couldn't identify the local robot.")
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
          username,
          robotName: localRobotName,
          accessToken: successfulLoginResponse.access_token,
          refreshToken: successfulLoginResponse.refresh_token ?? null,
          expiresAt:
            successfulLoginResponse.expires_in == null
              ? null
              : Date.now() + successfulLoginResponse.expires_in * 1000,
        })
      )
    },
    [dispatch, localRobotName]
  )

  return storeLoginState
}
