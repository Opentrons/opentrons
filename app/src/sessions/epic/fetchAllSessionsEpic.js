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

import type { FetchAllSessionsAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchAllSessionsAction> = action => ({
  method: GET,
  path: Constants.SESSIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchAllSessionsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchAllSessionsSuccess(host.name, body, meta)
    : Actions.fetchAllSessionsFailure(host.name, body, meta)
}

export const fetchAllSessionsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_ALL_SESSIONS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
