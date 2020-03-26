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

import type { DeleteRobotCalibrationCheckSessionAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<DeleteRobotCalibrationCheckSessionAction> = action => ({
  method: DELETE,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<DeleteRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.deleteRobotCalibrationCheckSessionSuccess(host.name, body, meta)
    : Actions.deleteRobotCalibrationCheckSessionFailure(host.name, body, meta)
}

export const deleteRobotCalibrationCheckSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
