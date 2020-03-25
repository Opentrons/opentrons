// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchRobotCalibrationCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchRobotCalibrationCheckSessionAction> = action => ({
  method: POST,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchRobotCalibrationCheckSessionSuccess(host.name, body, meta)
    : Actions.fetchRobotCalibrationCheckSessionFailure(host.name, body, meta)
}

export const fetchRobotCalibrationCheckSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_ROBOT_CALIBRATION_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
