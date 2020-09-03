// @flow
import semver from 'semver'
import { createSelector } from 'reselect'

import {
  HEALTH_STATUS_OK,
  getViewableRobots,
  getRobotApiVersionByName,
  getRobotByName,
} from '../discovery'
import * as Constants from './constants'

import type { State } from '../types'
import type { ViewableRobot } from '../discovery/types'
import type {
  BuildrootUpdateInfo,
  BuildrootUpdateSession,
  BuildrootUpdateType,
  RobotSystemType,
} from './types'

// TODO(mc, 2020-08-02): i18n
const UPDATE_SERVER_UNAVAILABLE =
  "Unable to update because your robot's update server is not responding"
const OTHER_ROBOT_UPDATING =
  'Unable to update because the app is currently updating a different robot'
const NO_UPDATE_FILES =
  'No update files found; please ensure your computer is connected to the internet and check again later'
const UNAVAILABLE = 'Unavailable'

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

// TODO(mc, 2020-09-03): switch to robotName instead of robot
export const getBuildrootUpdateAvailable: (
  state: State,
  robotName: string
) => BuildrootUpdateType | null = createSelector(
  getRobotApiVersionByName,
  state => getBuildrootUpdateVersion(state),
  (currentVersion, updateVersion) => {
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
)

export const getBuildrootUpdateDisplayInfo: (
  state: State,
  robotName: string
) => {|
  autoUpdateAction: string,
  autoUpdateDisabledReason: string | null,
  updateFromFileDisabledReason: string | null,
|} = createSelector(
  getRobotByName,
  getBuildrootUpdateAvailable,
  state => getBuildrootRobot(state),
  (robot, autoUpdateType, currentUpdatingRobot) => {
    const autoUpdateAction = autoUpdateType ?? UNAVAILABLE
    let autoUpdateDisabledReason = null
    let updateFromFileDisabledReason = null

    if (robot?.serverHealthStatus !== HEALTH_STATUS_OK) {
      autoUpdateDisabledReason = UPDATE_SERVER_UNAVAILABLE
      updateFromFileDisabledReason = UPDATE_SERVER_UNAVAILABLE
    } else if (
      currentUpdatingRobot !== null &&
      currentUpdatingRobot.name !== robot?.name
    ) {
      autoUpdateDisabledReason = OTHER_ROBOT_UPDATING
      updateFromFileDisabledReason = OTHER_ROBOT_UPDATING
    } else if (autoUpdateType === null) {
      autoUpdateDisabledReason = NO_UPDATE_FILES
    }

    return {
      autoUpdateAction,
      autoUpdateDisabledReason,
      updateFromFileDisabledReason,
    }
  }
)

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
