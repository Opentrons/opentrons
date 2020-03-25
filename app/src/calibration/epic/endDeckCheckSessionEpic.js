// @flow
import { ofType } from 'redux-observable'

import { DELETE } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { EndRobotCalibrationCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<EndRobotCalibrationCheckSessionAction> = action => ({
  method: DELETE,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<EndRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.endRobotCalibrationCheckSessionSuccess(host.name, body, meta)
    : Actions.endRobotCalibrationCheckSessionFailure(host.name, body, meta)
}

export const endRobotCalibrationCheckSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.END_ROBOT_CALIBRATION_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
