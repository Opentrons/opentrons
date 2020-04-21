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

import { ROBOT_CALIBRATION_CHECK_LOAD_LABWARE } from '../constants'


const UPDATE_ACTION_TYPE_TO_PATH_EXT = {
  [ROBOT_CALIBRATION_CHECK_LOAD_LABWARE]: 'loadLabware'
}

const mapActionToRequest: ActionToRequestMapper<UpdateRobotCalibrationCheckSessionAction> = action => {
  const path = `${Constants.ROBOT_CALIBRATION_CHECK_PATH}/${UPDATE_ACTION_TYPE_TO_PATH_EXT[action.type]}`
  return { method: POST, path, ...action.payload.params }
}

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
    ofType(
      Constants.ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
