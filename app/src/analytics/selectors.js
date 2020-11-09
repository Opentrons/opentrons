// @flow
import { createSelector } from 'reselect'

import {
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolApiVersion,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
} from '../protocol'

import {
  getViewableRobots,
  getConnectedRobot,
  getRobotApiVersion,
  getRobotFirmwareVersion,
} from '../discovery'

import {
  getBuildrootUpdateVersion,
  getBuildrootRobot,
  getBuildrootSession,
  getRobotSystemType,
} from '../buildroot'

import { getRobotSettings } from '../robot-settings'
import { getAttachedPipettes, getAttachedPipetteCalibrations } from '../pipettes'
import { getPipettes, getModules } from '../robot/selectors'

import { hash } from './hash'

import type { OutputSelector } from 'reselect'
import type { State } from '../types'

import type {
  AnalyticsConfig,
  ProtocolAnalyticsData,
  RobotAnalyticsData,
  BuildrootAnalyticsData,
  PipetteOffsetCalibrationAnalyticsData,
  TipLengthCalibrationAnalyticsData,
} from './types'

type ProtocolDataSelector = OutputSelector<State, void, ProtocolAnalyticsData>

export const FF_PREFIX = 'robotFF_'

const _getUnhashedProtocolAnalyticsData: ProtocolDataSelector = createSelector(
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolApiVersion,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
  getPipettes,
  getModules,
  (
    type,
    app,
    apiVersion,
    name,
    source,
    author,
    contents,
    pipettes,
    modules
  ) => ({
    protocolType: type || '',
    protocolAppName: app.name || '',
    protocolAppVersion: app.version || '',
    protocolApiVersion: apiVersion || '',
    protocolName: name || '',
    protocolSource: source || '',
    protocolAuthor: author || '',
    protocolText: contents || '',
    pipettes: pipettes.map(p => p.requestedAs ?? p.name).join(','),
    modules: modules.map(m => m.model).join(','),
  })
)

export const getProtocolAnalyticsData: State => Promise<ProtocolAnalyticsData> = createSelector(
  _getUnhashedProtocolAnalyticsData,
  data => {
    const hashTasks = [hash(data.protocolAuthor), hash(data.protocolText)]

    return Promise.all(hashTasks).then(([protocolAuthor, protocolText]) => ({
      ...data,
      protocolAuthor: data.protocolAuthor !== '' ? protocolAuthor : '',
      protocolText: data.protocolText !== '' ? protocolText : '',
    }))
  }
)

export function getRobotAnalyticsData(state: State): RobotAnalyticsData | null {
  const robot = getConnectedRobot(state)

  if (robot) {
    const pipettes = getAttachedPipettes(state, robot.name)
    const settings = getRobotSettings(state, robot.name)

    return settings.reduce(
      (result, setting) => ({
        ...result,
        [`${FF_PREFIX}${setting.id}`]: !!setting.value,
      }),
      {
        robotApiServerVersion: getRobotApiVersion(robot) || '',
        robotSmoothieVersion: getRobotFirmwareVersion(robot) || '',
        robotLeftPipette: pipettes.left?.model || '',
        robotRightPipette: pipettes.right?.model || '',
      }
    )
  }

  return null
}

export function getBuildrootAnalyticsData(
  state: State,
  robotName: string | null = null
): BuildrootAnalyticsData | null {
  const updateVersion = getBuildrootUpdateVersion(state)
  const session = getBuildrootSession(state)
  const robot =
    robotName === null
      ? getBuildrootRobot(state)
      : getViewableRobots(state).find(r => r.name === robotName) || null

  if (updateVersion === null || robot === null) return null

  const currentVersion = getRobotApiVersion(robot) || 'unknown'
  const currentSystem = getRobotSystemType(robot) || 'unknown'

  return {
    currentVersion,
    currentSystem,
    updateVersion,
    error: session?.error || null,
  }
}

export function getAnalyticsConfig(state: State): AnalyticsConfig | null {
  return state.config?.analytics ?? null
}

export function getAnalyticsOptedIn(state: State): boolean {
  return state.config?.analytics.optedIn ?? false
}

export function getAnalyticsOptInSeen(state: State): boolean {
  return state.config?.analytics.seenOptIn ?? true
}

export function getAnalyticsPipetteCalibrationData(state: State, mount: string): PipetteOffsetCalibrationAnalyticsData | null {
  const robot = getConnectedRobot(state)

  if (robot) {
    const pipcal = getAttachedPipetteCalibrations(state, robot.name)[mount]?.offset ?? null
    const pip = getAttachedPipettes(state, robot.name)[mount]
    return {
      calibrationExists: Boolean(pipcal),
      markedBad: pipcal?.status?.markedBad ?? false,
      pipetteModel: pip.model
    }
  }
  return null
}

export function getAnalyticsTipLengthCalibrationData(state: State, mount: string): TipLengthCalibrationAnalyticsData | null {
  const robot = getConnectedRobot(state)

  if (robot) {
    const tipcal = getAttachedPipetteCalibrations(state, robot.name)[mount]?.tipLength ?? null
    const pip = getAttachedPipettes(state, robot.name)[mount]
    return {
      calibrationExists: Boolean(tipcal),
      markedBad: tipcal?.status?.markedBad ?? false,
      pipetteModel: pip.model
    }
  }
  return null
}
