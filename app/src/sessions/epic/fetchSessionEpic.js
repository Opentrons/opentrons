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

import type { FetchSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchSessionAction> = action => ({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}`,
})

const mapResponseToAction: ResponseToActionMapper<FetchSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchSessionSuccess(host.name, body, meta)
    : Actions.fetchSessionFailure(
        host.name,
        originalAction.payload.sessionId,
        body,
        meta
      )
}

export const fetchSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
