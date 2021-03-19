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
import type { FetchCalibrationStatusAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchCalibrationStatusAction> = action => ({
  method: GET,
  path: Constants.CALIBRATION_STATUS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchCalibrationStatusAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchCalibrationStatusSuccess(host.name, body, meta)
    : Actions.fetchCalibrationStatusFailure(host.name, body, meta)
}

export const fetchCalibrationStatusEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_CALIBRATION_STATUS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
