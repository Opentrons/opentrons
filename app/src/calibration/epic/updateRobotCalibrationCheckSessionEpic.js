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

import type { UpdateRobotCalibrationCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdateRobotCalibrationCheckSessionAction> = action => ({
  method: POST,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
  ...action.payload.params
})

const mapResponseToAction: ResponseToActionMapper<UpdateRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.updateRobotCalibrationCheckSessionSuccess(host.name, body, meta)
    : Actions.updateRobotCalibrationCheckSessionFailure(host.name, body, meta)
}

export const updateRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.UPDATE_ROBOT_CALIBRATION_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
