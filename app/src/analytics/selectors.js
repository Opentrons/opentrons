// @flow
import type { OutputSelector } from 'reselect'
import { createSelector } from 'reselect'

import {
  getBuildrootRobot,
  getBuildrootSession,
  getBuildrootUpdateVersion,
  getRobotSystemType,
} from '../buildroot'
import {
  getConnectedRobot,
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getViewableRobots,
} from '../discovery'
import { getAttachedPipettes } from '../pipettes'
import {
  getProtocolApiVersion,
  getProtocolAuthor,
  getProtocolContents,
  getProtocolCreatorApp,
  getProtocolName,
  getProtocolSource,
  getProtocolType,
} from '../protocol'
import { getRobotSettings } from '../robot-settings'
import { getModules, getPipettes } from '../robot/selectors'
import type { State } from '../types'
import { hash } from './hash'
import type {
  AnalyticsConfig,
  BuildrootAnalyticsData,
  ProtocolAnalyticsData,
  RobotAnalyticsData,
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
