// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import { fetchWifiKeysFailure, fetchWifiKeysSuccess } from '../actions'
import { FETCH_WIFI_KEYS, WIFI_KEYS_PATH } from '../constants'
import type { FetchWifiKeysAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchWifiKeysAction> = action => ({
  method: GET,
  path: WIFI_KEYS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchWifiKeysAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? fetchWifiKeysSuccess(host.name, body.keys, meta)
    : fetchWifiKeysFailure(host.name, body, meta)
}

export const fetchWifiKeysEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(FETCH_WIFI_KEYS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
