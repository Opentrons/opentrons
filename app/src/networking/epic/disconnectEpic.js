// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'
import type { PostDisconnectNetworkAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<PostDisconnectNetworkAction> = action => ({
  method: POST,
  path: Constants.DISCONNECT_PATH,
  body: { ssid: action.payload.ssid },
})

const mapResponseToAction: ResponseToActionMapper<PostDisconnectNetworkAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.postDisconnectNetworkSuccess(host.name, meta)
    : Actions.postDisconnectNetworkFailure(host.name, body, meta)
}

export const disconnectEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(Constants.POST_DISCONNECT_NETWORK),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
