// @flow
import type { RobotHost } from '../../robot-api/types'
import type { BuildrootAction } from './types'

export const BR_UPDATE_INFO: 'buildroot:UPDATE_INFO' = 'buildroot:UPDATE_INFO'

export const BR_DOWNLOAD_PROGRESS: 'buildroot:DOWNLOAD_PROGRESS' =
  'buildroot:DOWNLOAD_PROGRESS'

export const BR_DOWNLOAD_ERROR: 'buildroot:DOWNLOAD_ERROR' =
  'buildroot:DOWNLOAD_ERROR'

export const BR_SET_UPDATE_SEEN: 'buildroot:SET_UPDATE_SEEN' =
  'buildroot:SET_UPDATE_SEEN'

export const BR_START_PREMIGRATION: 'buildroot:START_PREMIGRATION' =
  'buildroot:START_PREMIGRATION'

export const BR_PREMIGRATION_DONE: 'buildroot:PREMIGRATION_DONE' =
  'buildroot:PREMIGRATION_DONE'

export const BR_PREMIGRATION_ERROR: 'buildroot:PREMIGRATION_ERROR' =
  'buildroot:PREMIGRATION_ERROR'

export const BR_START_UPDATE: 'buildroot:START_UPDATE' =
  'buildroot:START_UPDATE'

export const BR_UNEXPECTED_ERROR: 'buildroot:UNEXPECTED_ERROR' =
  'buildroot:UNEXPECTED_ERROR'

export function setBuildrootUpdateSeen(): BuildrootAction {
  return { type: BR_SET_UPDATE_SEEN }
}

export function startBuildrootPremigration(
  payload: RobotHost
): BuildrootAction {
  return { type: BR_START_PREMIGRATION, meta: { shell: true }, payload }
}

export function startBuildrootUpdate(payload: string): BuildrootAction {
  return { type: BR_START_UPDATE, payload }
}

// TODO(mc, 2019-07-21): flesh this action out
export function unexpectedBuildrootError(): BuildrootAction {
  return { type: BR_UNEXPECTED_ERROR }
}
