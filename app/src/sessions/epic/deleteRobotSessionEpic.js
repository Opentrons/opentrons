// @flow
import { ofType } from 'redux-observable'

import { DELETE } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { DeleteRobotSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<DeleteRobotSessionAction> = action => ({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}`,
})

const mapResponseToAction: ResponseToActionMapper<DeleteRobotSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.deleteRobotSessionSuccess(host.name, body, meta)
    : Actions.deleteRobotSessionFailure(host.name, body, meta)
}

export const deleteRobotSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.DELETE_ROBOT_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
