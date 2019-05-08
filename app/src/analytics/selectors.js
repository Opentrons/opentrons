// @flow
import { createSelector } from 'reselect'

import {
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
} from '../protocol'

import {
  getConnectedRobot,
  getRobotApiVersion,
  getRobotFirmwareVersion,
} from '../discovery'

import { getRobotApiState, getPipettesRequest } from '../http-api-client'
import { getRobotSettingsState } from '../robot-api'

import hash from './hash'

import type { OutputSelector } from 'reselect'
import type { State } from '../types'
import type { ProtocolAnalyticsData, RobotAnalyticsData } from './types'

type ProtocolDataSelector = OutputSelector<State, void, ProtocolAnalyticsData>

export const FF_PREFIX = 'robotFF_'

const _getUnhashedProtocolAnalyticsData: ProtocolDataSelector = createSelector(
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
  (type, app, name, source, author, contents) => ({
    protocolType: type || '',
    protocolAppName: app.name || '',
    protocolAppVersion: app.version || '',
    protocolName: name || '',
    protocolSource: source || '',
    protocolAuthor: author || '',
    protocolText: contents || '',
  })
)

// TODO(mc, 2019-01-22): it would be good to have some way of caching these
// hashes; reselect isn't geared towards async, so perhaps RxJS / observables?
export function getProtocolAnalyticsData(
  state: State
): Promise<ProtocolAnalyticsData> {
  const data = _getUnhashedProtocolAnalyticsData(state)
  const hashTasks = [hash(data.protocolAuthor), hash(data.protocolText)]

  return Promise.all(hashTasks).then(result => {
    const [protocolAuthor, protocolText] = result

    return { ...data, protocolAuthor, protocolText }
  })
}

export function getRobotAnalyticsData(state: State): RobotAnalyticsData | null {
  const robot = getConnectedRobot(state)

  if (robot) {
    const api = getRobotApiState(state, robot)
    const pipettesRequest = getPipettesRequest(api)
    const settings = getRobotSettingsState(state, robot.name)

    const pipettes = pipettesRequest.response
      ? {
          left: pipettesRequest.response.left.model,
          right: pipettesRequest.response.right.model,
        }
      : { left: null, right: null }

    return settings.reduce(
      (result, setting) => ({
        ...result,
        [`${FF_PREFIX}${setting.id}`]: !!setting.value,
      }),
      {
        robotApiServerVersion: getRobotApiVersion(robot) || '',
        robotSmoothieVersion: getRobotFirmwareVersion(robot) || '',
        robotLeftPipette: pipettes.left || '',
        robotRightPipette: pipettes.right || '',
      }
    )
  }

  return null
}
