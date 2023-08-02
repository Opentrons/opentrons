import semver from 'semver'
import { createSelector } from 'reselect'

import {
  HEALTH_STATUS_OK,
  getViewableRobots,
  getRobotApiVersion,
  getRobotByName,
} from '../discovery'
import * as Constants from './constants'

import type { State } from '../types'
import type { ViewableRobot } from '../discovery/types'
import type {
  RobotUpdateInfo,
  RobotUpdateSession,
  RobotUpdateType,
  RobotSystemType,
} from './types'

// TODO(mc, 2020-08-02): i18n
const UPDATE_SERVER_UNAVAILABLE =
  "Unable to update because your robot's update server is not responding."
const OTHER_ROBOT_UPDATING =
  'Unable to update because the app is currently updating a different robot.'
const NO_UPDATE_FILES =
  'Unable to retrieve update for this robot. Ensure your computer is connected to the internet and try again later.'
const UNAVAILABLE = 'Update unavailable'

export function getRobotUpdateVersion(state: State): string | null {
  return state.robotUpdate.version || null
}

export function getRobotUpdateInfo(state: State): RobotUpdateInfo | null {
  return state.robotUpdate.info || null
}

export function getRobotUpdateTargetVersion(state: State): string | null {
  return (
    state.robotUpdate.session?.userFileInfo?.version ||
    state.robotUpdate.version ||
    null
  )
}

export function getRobotUpdateInProgress(
  state: State,
  robot: ViewableRobot
): boolean {
  const session = getRobotUpdateSession(state)
  const brRobot = getRobotUpdateRobot(state)

  return (
    robot === brRobot &&
    session?.step !== Constants.FINISHED &&
    session?.error === null
  )
}

export function getRobotUpdateDownloadProgress(state: State): number | null {
  return state.robotUpdate.downloadProgress
}

export function getRobotUpdateDownloadError(state: State): string | null {
  return state.robotUpdate.downloadError
}

export function getRobotUpdateSession(state: State): RobotUpdateSession | null {
  return state.robotUpdate.session
}

export function getRobotUpdateSessionRobotName(state: State): string | null {
  return state.robotUpdate.session?.robotName || null
}

export const getRobotUpdateRobot: (
  state: State
) => ViewableRobot | null = createSelector(
  getViewableRobots,
  getRobotUpdateSessionRobotName,
  (robots, robotName) => {
    if (robotName === null) return null

    return (
      robots.find(robot => {
        const searchName =
          robot.serverHealth?.capabilities?.buildrootUpdate != null ||
          robot.serverHealth?.capabilities?.systemUpdate != null
            ? robotName.replace(/^opentrons-/, '')
            : robotName

        return robot.name === searchName
      }) || null
    )
  }
)

const getRobotUpdateType = (
  currentVersion: string | null,
  updateVersion: string | null
): RobotUpdateType | null => {
  const validCurrent: string | null = semver.valid(currentVersion)
  const validUpdate: string | null = semver.valid(updateVersion)
  let type = null

  if (validUpdate && validCurrent) {
    if (semver.gt(validUpdate, validCurrent)) {
      type = Constants.UPGRADE
    } else if (semver.lt(validUpdate, validCurrent)) {
      type = Constants.DOWNGRADE
    } else if (semver.eq(validUpdate, validCurrent)) {
      type = Constants.REINSTALL
    }
  }

  return type
}

export function getRobotUpdateAvailable(
  state: State,
  robot: ViewableRobot
): RobotUpdateType | null {
  const currentVersion = getRobotApiVersion(robot)
  const updateVersion = getRobotUpdateVersion(state)

  return getRobotUpdateType(currentVersion, updateVersion)
}

export const getRobotUpdateDisplayInfo: (
  state: State,
  robotName: string
) => {
  autoUpdateAction: string
  autoUpdateDisabledReason: string | null
  updateFromFileDisabledReason: string | null
} = createSelector(
  getRobotByName,
  state => getRobotUpdateRobot(state),
  state => getRobotUpdateVersion(state),
  (robot, currentUpdatingRobot, updateVersion) => {
    const robotVersion = robot ? getRobotApiVersion(robot) : null
    const autoUpdateType = getRobotUpdateType(robotVersion, updateVersion)
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
      return Constants.OT2_BALENA
    }

    return Constants.OT2_BUILDROOT
  }

  return null
}
