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

import type { FetchDeckCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchDeckCheckSessionAction> = action => ({
  method: POST,
  path: Constants.DECK_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchDeckCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchDeckCheckSessionSuccess(host.name, body, meta)
    : Actions.fetchDeckCheckSessionFailure(host.name, body, meta)
}

export const fetchDeckCheckSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_DECK_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
