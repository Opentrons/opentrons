import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getOAuth2Token, OAUTH2_CLIENT_ID } from '@opentrons/api-client'

import { useThrottler } from '/app/App/hooks/useThrottler'
import { useActivityListener } from '/app/local-resources/dom-utils/hooks/useActivityListener'
import { useRobot } from '/app/redux-resources/robots'
import { OPENTRONS_USB } from '/app/redux/discovery'
import {
  getAuthStateForRobot,
  getMostRecentRobotName,
  refreshLogin,
  useAccessTokenForRobot,
} from '/app/redux/robot-auth'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import type { HostConfig, RefreshRequest } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

const THROTTLE_SEC = 10

/**
 * This keeps the user logged in to their robot while they're actively using the UI.
 * It sends periodic auth refresh requests while there is activity like typing and
 * clicking.
 *
 * This should be called once per app. It depends on having access to Redux state,
 * but does not depend on being inside an <ApiHostProvider>.
 */
export function useRefreshAccessTokenOnActivity(): void {
  const dispatch = useDispatch()

  const robotName = useSelector(getMostRecentRobotName)
  const hostConfig = useHostConfigForRobot(robotName)
  const authState = useSelector((state: State) =>
    robotName != null ? getAuthStateForRobot(state, robotName) : null
  )

  // We're implementing our own limiter for at most one request in flight, instead of
  // using React Query and its `.isLoading` state. We do this because React Query's
  // `useMutation()` triggers a re-render every time the request state changes,
  // which would be totally unnecessary in our usage here, and especially disruptive
  // since this hook lives so high in the component hierarchy. `useQuery()` has a
  // `select` option to solve this problem, but `useMutation()` doesn't. :\
  const isRequestInFlight = useRef<boolean>(false)

  const handleThrottledActivity = useCallback(async () => {
    if (
      isRequestInFlight.current ||
      hostConfig == null ||
      robotName == null ||
      authState?.refreshToken == null
    ) {
      return
    }

    const request: RefreshRequest = {
      grant_type: 'refresh_token',
      refresh_token: authState.refreshToken,
      client_id: OAUTH2_CLIENT_ID,
    }

    isRequestInFlight.current = true
    try {
      const response = await getOAuth2Token(hostConfig, request)
      const expiresIn = response.data.expires_in ?? null
      const expiresAt = expiresIn != null ? Date.now() + expiresIn * 1000 : null
      dispatch(
        refreshLogin({
          robotName,
          username: authState.username,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token ?? null,
          expiresAt,
        })
      )
    } finally {
      isRequestInFlight.current = false
    }
  }, [authState, dispatch, hostConfig, robotName])

  const activityThrottler = useThrottler(THROTTLE_SEC * 1000)
  const handleActivity = useCallback(() => {
    activityThrottler.maybeCall(() => {
      void handleThrottledActivity()
    })
  }, [handleThrottledActivity, activityThrottler])

  useActivityListener(handleActivity)
}

function useHostConfigForRobot(robotName: string | null): HostConfig | null {
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  const result = useMemo<HostConfig | null>(() => {
    if (robot?.ip == null) {
      return null
    } else {
      // todo(mm, 2026-05-20): Deduplicate this. https://opentrons.atlassian.net/browse/AUTH-2856
      return {
        hostname: robot.ip,
        port: robot.port,
        requestor:
          robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
        token,
      }
    }
  }, [robot, token])

  return result
}
