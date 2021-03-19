// @flow
import { ofType } from 'redux-observable'
import { mapTo } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { getRobotRestartPath } from '../../robot-settings'
import { startDiscovery } from '../../discovery'
import * as Constants from '../constants'
import * as Actions from '../actions'

import type { Epic } from '../../types'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { RestartRobotAction } from '../types'

const RESTART_DISCOVERY_TIMEOUT_MS = 60000

const mapActionToRequest: ActionToRequestMapper<RestartRobotAction> = (
  action,
  state
) => {
  const path =
    getRobotRestartPath(state, action.payload.robotName) ||
    Constants.RESTART_PATH

  return { method: POST, path }
}

const mapResponseToAction: ResponseToActionMapper<RestartRobotAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const { robot: _, ...prevMeta } = originalAction.meta
  const meta = { ...prevMeta, response: responseMeta }

  return response.ok
    ? Actions.restartRobotSuccess(host.name, meta)
    : Actions.restartRobotFailure(host.name, body, meta)
}

export const restartEpic: Epic = (action$, state$) => {
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

export const startDiscoveryOnRestartEpic: Epic = action$ => {
  return action$.pipe(
    ofType(Constants.RESTART_SUCCESS),
    mapTo(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
  )
}
