// @flow
import { filter } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { CreateRobotCalibrationCheckSessionAction } from '../types'

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

  return response.ok
    ? Actions.createRobotCalibrationCheckSessionSuccess(host.name, body, meta)
    : Actions.createRobotCalibrationCheckSessionFailure(host.name, body, meta)
}

export const createRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    filter((action: Action) => {
      const explicitCreate =
        action.type === Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION
      const recreating =
        action.type ===
          Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS &&
        !!action.meta.recreating

      return explicitCreate || recreating
    }),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
