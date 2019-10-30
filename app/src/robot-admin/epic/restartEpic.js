// @flow
import { ofType } from 'redux-observable'
import { mapTo } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { getRobotRestartPath } from '../../robot-settings'
import { startDiscovery } from '../../discovery'
import * as Constants from '../constants'
import * as Actions from '../actions'
import * as Types from '../types'

import type { StrictEpic } from '../../types'
import type { StartDiscoveryAction } from '../../discovery/types'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

const RESTART_DISCOVERY_TIMEOUT_MS = 60000

const mapActionToRequest: ActionToRequestMapper<Types.RestartRobotAction> = (
  action,
  state
) => {
  const { robot: _, ...meta } = action.meta
  const path =
    getRobotRestartPath(state, action.payload.robotName) ||
    Constants.RESTART_PATH

  return [{ method: POST, path }, meta]
}

const mapResponseToAction: ResponseToActionMapper<Types.RestartRobotDoneAction> = (
  response,
  prevMeta
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...prevMeta, response: responseMeta }

  return response.ok
    ? Actions.restartRobotSuccess(host.name, meta)
    : Actions.restartRobotFailure(host.name, body, meta)
}

export const restartEpic: StrictEpic<Types.RestartRobotDoneAction> = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.RESTART),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

export const startDiscoveryOnRestartEpic: StrictEpic<StartDiscoveryAction> = action$ => {
  return action$.pipe(
    ofType(Constants.RESTART_SUCCESS),
    mapTo(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
  )
}
