// @flow
import semver from 'semver'
import { createSelector } from 'reselect'

import {
  getViewableRobots,
  getRobotApiVersion,
} from '../../discovery/selectors'
import remote from '../remote'

import type { State } from '../../types'
import type { ViewableRobot } from '../../discovery'
import type {
  BuildrootUpdateInfo,
  BuildrootUpdateSession,
  BuildrootUpdateType,
  RobotSystemType,
} from './types'

export function getBuildrootUpdateInfo(
  state: State
): BuildrootUpdateInfo | null {
  return state.shell.buildroot.info || null
}

export function getBuildrootTargetVersion(state: State): string | null {
  return (
    state.shell.buildroot.session?.userFileInfo?.version ||
    state.shell.buildroot.info?.version ||
    null
  )
}

export function getBuildrootUpdateSeen(state: State): boolean {
  return state.shell.buildroot.seen || false
}

export function getBuildrootUpdateInProgress(
  state: State,
  robot: ViewableRobot
): boolean {
  const session = getBuildrootSession(state)
  const brRobot = getBuildrootRobot(state)

  return (
    robot === brRobot && session?.step !== 'finished' && session?.error === null
  )
}

export function getBuildrootDownloadProgress(state: State): number | null {
  return state.shell.buildroot.downloadProgress
}

export function getBuildrootDownloadError(state: State): string | null {
  return state.shell.buildroot.downloadError
}

export function getBuildrootSession(
  state: State
): BuildrootUpdateSession | null {
  return state.shell.buildroot.session
}

export function getBuildrootRobotName(state: State): string | null {
  return state.shell.buildroot.session?.robotName || null
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

const compareCurrentVersionToUpdate = (
  currentVersion: string,
  updateVersion: string
): boolean => {
  const validCurrent = semver.valid(currentVersion)
  const validUpdate = semver.valid(updateVersion)

  return validCurrent !== null && validUpdate !== null
    ? semver.gt(validUpdate, validCurrent)
    : false
}

export function getBuildrootUpdateAvailable(
  state: State,
  currentVersion: string
): boolean {
  const updateVersion = getBuildrootUpdateInfo(state)?.version

  return updateVersion != null
    ? compareCurrentVersionToUpdate(currentVersion, updateVersion)
    : false
}

export function compareRobotVersionToUpdate(
  robot: ViewableRobot
): BuildrootUpdateType {
  const currentVersion = getRobotApiVersion(robot)
  // TODO(mc, 2019-07-23): get this from state once BR state info can come in piecemeal
  const updateVersion: string = remote.update.CURRENT_VERSION

  const validCurrent: string | null = semver.valid(currentVersion)
  const validUpdate: string | null = semver.valid(updateVersion)
  let type = 'upgrade'

  if (validCurrent && validUpdate) {
    if (semver.gt(validUpdate, validCurrent)) {
      type = 'upgrade'
    } else if (semver.lt(validUpdate, validCurrent)) {
      type = 'downgrade'
    } else if (semver.eq(validUpdate, validCurrent)) {
      type = 'reinstall'
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
      return 'balena'
    }

    return 'buildroot'
  }

  return null
}
