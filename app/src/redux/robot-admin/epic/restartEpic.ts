import { ofType } from 'redux-observable'
import { mapTo } from 'rxjs/operators'

import { startDiscovery } from '../../discovery'
import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { RestartRobotAction } from '../types'

const RESTART_DISCOVERY_TIMEOUT_MS = 60000

const mapActionToRequest: ActionToRequestMapper<RestartRobotAction> = (
  action,
  state
) => {
  return { method: POST, path: Constants.RESTART_PATH }
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
    : Actions.restartRobotFailure(
        host.name,
        body as Record<string, unknown>,
        meta
      )
}

export const restartEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, RestartRobotAction>(Constants.RESTART),
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
