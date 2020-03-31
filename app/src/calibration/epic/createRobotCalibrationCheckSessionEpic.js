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

import type { CreateRobotCalibrationCheckSessionAction } from '../types'

// TODO: next BC 2020-03-31: make this epic called "fetch" instead of "create"
// and have it first check if there is a session in state and issue a GET request if so,
// then post if there isn't then delete and post again if that original returns a 409

const mapActionToRequest: ActionToRequestMapper<CreateRobotCalibrationCheckSessionAction> = action => ({
  method: POST,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<CreateRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  if (response.status === 409) {
    // delete session and recreate if conflicting
    return Actions.deleteRobotCalibrationCheckSession(host.name, true)
  } else {
    return response.ok
      ? Actions.createRobotCalibrationCheckSessionSuccess(host.name, body, meta)
      : Actions.createRobotCalibrationCheckSessionFailure(host.name, body, meta)
  }
}

export const createRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
