// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { UpdateLightsAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdateLightsAction> = action => ({
  method: POST,
  path: Constants.LIGHTS_PATH,
  body: { on: action.payload.lightsOn },
})

const mapResponseToAction: ResponseToActionMapper<UpdateLightsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.updateLightsSuccess(host.name, body.on, meta)
    : Actions.updateLightsFailure(host.name, body, meta)
}

export const updateLightsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.UPDATE_LIGHTS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
