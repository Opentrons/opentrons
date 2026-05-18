import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { ShutdownRobotAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<
  ShutdownRobotAction
> = action => {
  return { method: POST, path: Constants.SHUTDOWN_PATH }
}

const mapResponseToAction: ResponseToActionMapper<ShutdownRobotAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const { robot: _, ...prevMeta } = originalAction.meta
  const meta = { ...prevMeta, response: responseMeta }

  return response.ok
    ? Actions.shutdownRobotSuccess(host.name, meta)
    : Actions.shutdownRobotFailure(
        host.name,
        body as Record<string, unknown>,
        meta
      )
}

export const shutdownEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, ShutdownRobotAction>(Constants.SHUTDOWN),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
