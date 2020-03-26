// @flow
import { filter, map } from 'rxjs/operators'

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

export const deleteRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    filter(action => {
      const explicitDelete =
        action.type === Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION
      const clearExisting =
        action.type ===
          Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE &&
        action.meta.response.status === 409

      return explicitDelete || clearExisting
    }),
    map(action => {
      if (
        action.type === Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE
      ) {
        return { ...action, meta: { ...action.meta, recreating: true } }
      }
    }),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
