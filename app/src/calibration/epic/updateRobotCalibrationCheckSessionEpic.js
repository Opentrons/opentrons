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

import {
  ROBOT_CALIBRATION_CHECK_PATH,
  ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
  ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
  ROBOT_CALIBRATION_CHECK_JOG,
  ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  ROBOT_CALIBRATION_CHECK_CONFIRM_TIP,
  ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP,
  CHECK_UPDATE_PATH_LOAD_LABWARE,
  CHECK_UPDATE_PATH_PREPARE_PIPETTE,
  CHECK_UPDATE_PATH_JOG,
  CHECK_UPDATE_PATH_PICK_UP_TIP,
  CHECK_UPDATE_PATH_CONFIRM_TIP,
  CHECK_UPDATE_PATH_INVALIDATE_TIP,
} from '../constants'

const mapActionToRequest: ActionToRequestMapper<UpdateRobotCalibrationCheckSessionAction> = action => {
  let requestParams = {}
  switch (action.type) {
    case ROBOT_CALIBRATION_CHECK_LOAD_LABWARE: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_LOAD_LABWARE}`,
      }
      break
    }
    case ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_PREPARE_PIPETTE}`,
        body: { pipetteId: action.payload.pipetteId },
      }
      break
    }
    case ROBOT_CALIBRATION_CHECK_JOG: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_JOG}`,
        body: {
          pipetteId: action.payload.pipetteId,
          vector: action.payload.vector,
        },
      }
      break
    }
    case ROBOT_CALIBRATION_CHECK_PICK_UP_TIP: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_PICK_UP_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
      break
    }
    case ROBOT_CALIBRATION_CHECK_CONFIRM_TIP: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_CONFIRM_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
      break
    }
    case ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP: {
      requestParams = {
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_INVALIDATE_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
      break
    }
  }
  return { method: POST, ...requestParams }
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
      ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
      ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
      ROBOT_CALIBRATION_CHECK_JOG,
      ROBOT_CALIBRATION_CHECK_PICK_UP_TIP
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
