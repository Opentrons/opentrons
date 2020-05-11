// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { UpdateRobotSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdateRobotSessionAction> = action => ({
  method: POST,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}/${Constants.SESSIONS_UPDATE_PATH_EXTENSION}`,
  body: action.payload.update,
  body: {
    data: {
      type: 'Command',
      attributes: action.payload.update,
    },
  },
})

const mapResponseToAction: ResponseToActionMapper<UpdateRobotSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  
  return response.ok
      ? Actions.updateRobotSessionSuccess(host.name, body, meta)
      : Actions.updateRobotSessionFailure(host.name, body, meta)
}

export const updateRobotSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.UPDATE_ROBOT_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
