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

import type { CreateRobotSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<CreateRobotSessionAction> = action => ({
  method: POST,
  path: Constants.SESSIONS_PATH,
  body: {
    data: {
      type: 'Session',
      attributes: {
        session_type: action.payload.sessionType,
      },
    },
  },
})

const mapResponseToAction: ResponseToActionMapper<CreateRobotSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.createRobotSessionSuccess(host.name, body, meta)
    : Actions.createRobotSessionFailure(host.name, body, meta)
}

export const createRobotSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.CREATE_ROBOT_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
