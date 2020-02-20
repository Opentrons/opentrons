// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Epic } from '../../types'
import type { FetchWifiListAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchWifiListAction> = action => ({
  method: GET,
  path: Constants.WIFI_LIST_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchWifiListAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchWifiListSuccess(host.name, body.list, meta)
    : Actions.fetchWifiListFailure(host.name, body, meta)
}

export const wifiListEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(
      Constants.FETCH_WIFI_LIST,
      Constants.POST_DISCONNECT_NETWORK_SUCCESS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
