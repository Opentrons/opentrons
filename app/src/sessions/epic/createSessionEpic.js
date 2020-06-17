// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'
import type { CreateSessionAction, EnsureSessionAction } from '../types'

export const mapActionToRequest = (
  action: CreateSessionAction | EnsureSessionAction
): RobotApiRequestOptions => ({
  method: POST,
  path: Constants.SESSIONS_PATH,
  body: {
    data: {
      type: 'Session',
      attributes: {
        sessionType: action.payload.sessionType,
      },
    },
  },
})

export const mapResponseToAction = (
  response: RobotApiResponse,
  originalAction: CreateSessionAction | EnsureSessionAction
): Action => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.createSessionSuccess(host.name, body, meta)
    : Actions.createSessionFailure(host.name, body, meta)
}

export const createSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.CREATE_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
