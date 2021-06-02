import { ofType } from 'redux-observable'

import { GET } from '../../../robot-api/constants'
import { mapToRobotApiRequest } from '../../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../../robot-api/operators'
import type { Action, Epic } from '../../../types'
import type { FetchTipLengthCalibrationsAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchTipLengthCalibrationsAction> = action => ({
  method: GET,
  path: Constants.TIP_LENGTH_CALIBRATIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchTipLengthCalibrationsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchTipLengthCalibrationsSuccess(host.name, body, meta)
    : Actions.fetchTipLengthCalibrationsFailure(host.name, body, meta)
}

export const fetchTipLengthCalibrationsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchTipLengthCalibrationsAction>(
      Constants.FETCH_TIP_LENGTH_CALIBRATIONS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
