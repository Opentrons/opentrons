import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMatch } from 'react-router-dom'

import { getIsOnDevice } from '../config'
import { getLocalRobot } from '../discovery'
import {
  getAuthStateForRobot,
  getCurrentUsernameForLocalRobot,
  getUsernameForRobot,
  logOut,
} from './slice'

import type { State } from '../types'

/** Return the OAuth 2 access token to make requests to the given robot, if we have one. */
export function useAccessTokenForRobot(
  robotName: string | null
): string | null {
  const selector = useCallback(
    (state: State) => {
      if (robotName == null) {
        return null
      } else {
        return getAuthStateForRobot(state, robotName)?.accessToken ?? null
      }
    },
    [robotName]
  )
  return useSelector(selector)
}

/** Return the username for the given robot, if we are logged in to it. */
export function useUsernameForRobot(robotName: string | null): string | null {
  const selector = useCallback(
    (state: State) => getUsernameForRobot(state, robotName),
    [robotName]
  )
  return useSelector(selector)
}

/**
 * Return the username for the robot the user is currently acting on:
 * the local robot on ODD, or the robot being viewed on desktop.
 */
export function useCurrentUsername(): string | null {
  const isOnDevice = useSelector(getIsOnDevice)
  const deviceRouteMatch = useMatch('/devices/:robotName/*')
  const desktopRobotName = deviceRouteMatch?.params?.robotName ?? null
  const localRobotUsername = useSelector(getCurrentUsernameForLocalRobot)
  const desktopRobotUsername = useUsernameForRobot(desktopRobotName)

  return isOnDevice ? localRobotUsername : desktopRobotUsername
}

export function useCurrentRobotName(): string | null {
  const isOnDevice = useSelector(getIsOnDevice)
  const deviceRouteMatch = useMatch('/devices/:robotName/*')
  const localRobotName = useSelector(getLocalRobot)?.name ?? null
  const desktopRobotName = deviceRouteMatch?.params?.robotName ?? null
  return isOnDevice ? localRobotName : desktopRobotName
}

/** Log out of the robot the user is currently acting on. */
export function useLogout(): () => void {
  const dispatch = useDispatch()
  const robotName = useCurrentRobotName()

  return useCallback(() => {
    if (robotName == null) {
      console.warn("Couldn't identify the robot to log out of.")
    } else {
      dispatch(logOut({ robotName }))
    }
  }, [dispatch, robotName])
}
