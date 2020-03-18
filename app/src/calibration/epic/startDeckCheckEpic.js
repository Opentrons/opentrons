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

import type { StartDeckCheckAction } from '../types'
import type {
} from '../api-types'

const mapActionToRequest: ActionToRequestMapper<StartDeckCheckAction> = action => ({
  method: GET,
  path: Constants.DECK_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchModulesAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.startDeckCheckSuccess(host.name, body, meta)
    : Actions.startDeckCheckFailure(host.name, body, meta)
}

export const startDeckCheckEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.START_DECK_CHECK),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
