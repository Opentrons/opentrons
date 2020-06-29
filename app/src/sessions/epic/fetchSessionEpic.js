// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import type { ResponseToActionMapper } from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { RobotApiRequestOptions } from '../../robot-api/types'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { CreateSessionCommandAction, FetchSessionAction } from '../types'

export const mapActionToRequest = (
  action: FetchSessionAction | CreateSessionCommandAction
): RobotApiRequestOptions => ({
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
