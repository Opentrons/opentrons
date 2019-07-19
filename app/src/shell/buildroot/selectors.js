// @flow
import semver from 'semver'
import { createSelector } from 'reselect'

import { getLiveRobots } from '../../discovery/selectors'

import type { OutputSelector } from 'reselect'
import type { State } from '../../types'
import type { ViewableRobot } from '../../discovery'
import type { BuildrootUpdateInfo, BuildrootUpdateSession } from './types'

export function getBuildrootUpdateInfo(
  state: State
): BuildrootUpdateInfo | null {
  return state.shell.buildroot.info || null
}

export function getBuildrootUpdateSeen(state: State): boolean {
  return state.shell.buildroot.seen || false
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

export const getBuildrootRobot: OutputSelector<
  State,
  void,
  ViewableRobot | null
> = createSelector(
  getLiveRobots,
  getBuildrootRobotName,
  (robots, robotName) => robots.find(r => r.name === robotName) || null
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
