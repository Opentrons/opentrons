// @flow

import { ofType, combineEpics } from 'redux-observable'
import { map } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'
import type { PostWifiDisconnectAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<PostWifiDisconnectAction> = action => ({
  method: POST,
  path: Constants.WIFI_DISCONNECT_PATH,
  body: { ssid: action.payload.ssid },
})

const mapResponseToAction: ResponseToActionMapper<PostWifiDisconnectAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.postWifiDisconnectSuccess(host.name, meta)
    : Actions.postWifiDisconnectFailure(host.name, body, meta)
}

const postDisconnectEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(Constants.POST_WIFI_DISCONNECT),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )

const handlePostDisconnectNetworkSuccessEpic: Epic = action$ => {
  return action$.pipe(
    ofType(Constants.POST_WIFI_DISCONNECT_SUCCESS),
    map(action => Actions.fetchWifiList(action.payload.robotName))
  )
}

export const disconnectEpic: Epic = combineEpics(
  postDisconnectEpic,
  handlePostDisconnectNetworkSuccessEpic
)
