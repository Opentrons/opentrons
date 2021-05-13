// @flow
import { ofType } from 'redux-observable'
import omit from 'lodash/omit'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { postWifiKeysSuccess, postWifiKeysFailure } from '../actions'
import { POST_WIFI_KEYS, WIFI_KEYS_PATH } from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Epic } from '../../types'
import type { PostWifiKeysAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<PostWifiKeysAction> = action => {
  const { keyFile } = action.payload
  const form = new FormData()
  form.append('key', keyFile, keyFile.name)

  return { method: POST, path: WIFI_KEYS_PATH, form }
}

const mapResponseToAction: ResponseToActionMapper<PostWifiKeysAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? postWifiKeysSuccess(host.name, omit(body, 'message'), meta)
    : postWifiKeysFailure(host.name, body, meta)
}

export const postWifiKeysEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(POST_WIFI_KEYS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
