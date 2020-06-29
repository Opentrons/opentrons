// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { FetchLightsAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchLightsAction> = () => ({
  method: GET,
  path: Constants.LIGHTS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchLightsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchLightsSuccess(host.name, body.on, meta)
    : Actions.fetchLightsFailure(host.name, body, meta)
}

export const fetchLightsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_LIGHTS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
