// @flow
import { ofType } from 'redux-observable'

import { DELETE } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import * as Types from '../types'
import * as Actions from '../actions'
import * as Constants from '../constants'

type ResponseAction =
  | Types.CreateRobotCalibrationCheckSessionAction
  | Types.DeleteRobotCalibrationCheckSessionSuccessAction
  | Types.DeleteRobotCalibrationCheckSessionFailureAction

const mapActionToRequest: ActionToRequestMapper<Types.DeleteRobotCalibrationCheckSessionAction> = action => ({
  method: DELETE,
  path: Constants.ROBOT_CALIBRATION_CHECK_PATH,
})

const mapResponseToAction: ResponseToActionMapper<Types.DeleteRobotCalibrationCheckSessionAction> = (
  response,
  originalAction
): ResponseAction => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  if (response.ok) {
    return originalAction.payload.recreate
      ? Actions.createRobotCalibrationCheckSession(host.name, {
          requestId: meta.requestId,
        })
      : Actions.deleteRobotCalibrationCheckSessionSuccess(host.name, body, meta)
  } else {
    return Actions.deleteRobotCalibrationCheckSessionFailure(
      host.name,
      body,
      meta
    )
  }
}

export const deleteRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
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
