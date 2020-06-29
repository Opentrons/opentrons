// @flow
import { combineEpics, ofType } from 'redux-observable'
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { startDiscovery } from '../../discovery'
import { POST } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { PostWifiConfigureAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<PostWifiConfigureAction> = action => ({
  method: POST,
  path: Constants.WIFI_CONFIGURE_PATH,
  body: action.payload.options,
})

const mapResponseToAction: ResponseToActionMapper<PostWifiConfigureAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.postWifiConfigureSuccess(host.name, body.ssid, meta)
    : Actions.postWifiConfigureFailure(host.name, body, meta)
}

const postWifiConfigureEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.POST_WIFI_CONFIGURE),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

const handleWifiConfigureSuccessEpic: Epic = action$ => {
  return action$.pipe(
    ofType(Constants.POST_WIFI_CONFIGURE_SUCCESS),
    switchMap(action =>
      of(Actions.fetchWifiList(action.payload.robotName), startDiscovery())
    )
  )
}

export const wifiConfigureEpic: Epic = combineEpics(
  postWifiConfigureEpic,
  handleWifiConfigureSuccessEpic
)
