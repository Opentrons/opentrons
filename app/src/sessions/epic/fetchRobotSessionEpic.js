// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchRobotSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchRobotSessionAction> = action => ({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}`,
})

const mapResponseToAction: ResponseToActionMapper<FetchRobotSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchRobotSessionSuccess(host.name, body, meta)
    : Actions.fetchRobotSessionFailure(host.name, body, meta)
}

export const fetchRobotSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_ROBOT_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
