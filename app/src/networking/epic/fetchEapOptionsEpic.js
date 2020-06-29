// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import { fetchEapOptionsFailure, fetchEapOptionsSuccess } from '../actions'
import { EAP_OPTIONS_PATH, FETCH_EAP_OPTIONS } from '../constants'
import type { FetchWifiKeysAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchWifiKeysAction> = action => ({
  method: GET,
  path: EAP_OPTIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchWifiKeysAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? fetchEapOptionsSuccess(host.name, body.options, meta)
    : fetchEapOptionsFailure(host.name, body, meta)
}

export const fetchEapOptionsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(FETCH_EAP_OPTIONS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
