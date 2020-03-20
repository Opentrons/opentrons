// @flow
import { ofType } from 'redux-observable'

import { DELETE } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { EndDeckCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<EndDeckCheckSessionAction> = action => ({
  method: DELETE,
  path: Constants.DECK_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<EndDeckCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.endDeckCheckSessionSuccess(host.name, body, meta)
    : Actions.endDeckCheckSessionFailure(host.name, body, meta)
}

export const endDeckCheckSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.END_DECK_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
