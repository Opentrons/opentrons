// @flow
import semver from 'semver'
import { createSelector } from 'reselect'

import { getViewableRobots, getRobotApiVersion } from '../discovery/selectors'

import type { State } from '../types'
import type { ViewableRobot } from '../discovery/types'
import * as Constants from './constants'
import type {
  BuildrootUpdateInfo,
  BuildrootUpdateSession,
  BuildrootUpdateType,
  RobotSystemType,
} from './types'

export function getBuildrootUpdateVersion(state: State): string | null {
  return state.buildroot.version || null
}

export function getBuildrootUpdateInfo(
  state: State
): BuildrootUpdateInfo | null {
  return state.buildroot.info || null
}

export function getBuildrootTargetVersion(state: State): string | null {
  return (
    state.buildroot.session?.userFileInfo?.version ||
    state.buildroot.version ||
    null
  )
}

export function getBuildrootUpdateSeen(state: State): boolean {
  return state.buildroot.seen || false
}

export function getBuildrootUpdateInProgress(
  state: State,
  robot: ViewableRobot
): boolean {
  const session = getBuildrootSession(state)
  const brRobot = getBuildrootRobot(state)

  return (
    robot === brRobot &&
    session?.step !== Constants.FINISHED &&
    session?.error === null
  )
}

export function getBuildrootDownloadProgress(state: State): number | null {
  return state.buildroot.downloadProgress
}

export function getBuildrootDownloadError(state: State): string | null {
  return state.buildroot.downloadError
}

export function getBuildrootSession(
  state: State
): BuildrootUpdateSession | null {
  return state.buildroot.session
}

export function getBuildrootRobotName(state: State): string | null {
  return state.buildroot.session?.robotName || null
}

export const getBuildrootRobot: State => ViewableRobot | null = createSelector(
  getViewableRobots,
  getBuildrootRobotName,
  (robots, robotName) => {
    if (robotName === null) return null

    return (
      robots.find(robot => {
        const searchName =
          robot.serverHealth?.capabilities?.buildrootUpdate != null
            ? robotName.replace(/^opentrons-/, '')
            : robotName

        return robot.name === searchName
      }) || null
    )
  }
)

export function getBuildrootUpdateAvailable(
  state: State,
  robot: ViewableRobot
): BuildrootUpdateType | null {
  const updateVersion = getBuildrootUpdateVersion(state)
  const currentVersion = getRobotApiVersion(robot)

  const validCurrent: string | null = semver.valid(currentVersion)
  const validUpdate: string | null = semver.valid(updateVersion)
  let type = null

  if (validUpdate) {
    if (!validCurrent || semver.gt(validUpdate, validCurrent)) {
      type = Constants.UPGRADE
    } else if (semver.lt(validUpdate, validCurrent)) {
      type = Constants.DOWNGRADE
    } else if (semver.eq(validUpdate, validCurrent)) {
      type = Constants.REINSTALL
    }
  }

  return type
}

export function getRobotSystemType(
  robot: ViewableRobot
): RobotSystemType | null {
  const { serverHealth } = robot

  if (serverHealth) {
    const { capabilities } = serverHealth

    if (!capabilities || capabilities.balenaUpdate) {
      return Constants.BALENA
    }

    return Constants.BUILDROOT
  }

  return null
}
