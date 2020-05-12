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

import type { CreateSessionCommandAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<CreateSessionCommandAction> = action => ({
  method: POST,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}/${Constants.SESSIONS_UPDATE_PATH_EXTENSION}`,
  body: {
    data: {
      type: 'Command',
      attributes: {
        command: action.payload.command.command,
        data: action.payload.command.data,
      },
    },
  },
})

const mapResponseToAction: ResponseToActionMapper<CreateSessionCommandAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.createSessionCommandSuccess(
        host.name,
        originalAction.payload.sessionId,
        body,
        meta
      )
    : Actions.createSessionCommandFailure(
        host.name,
        originalAction.payload.sessionId,
        body,
        meta
      )
}

export const createSessionCommandEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.CREATE_SESSION_COMMAND),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
