// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import { createLogger } from '../../logger'

import * as Actions from '../actions'

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
  ROBOT_CALIBRATION_CHECK_COMPARE_POINT,
  ROBOT_CALIBRATION_CHECK_CONFIRM_STEP,
  CHECK_UPDATE_PATH_LOAD_LABWARE,
  CHECK_UPDATE_PATH_PREPARE_PIPETTE,
  CHECK_UPDATE_PATH_JOG,
  CHECK_UPDATE_PATH_PICK_UP_TIP,
  CHECK_UPDATE_PATH_CONFIRM_TIP,
  CHECK_UPDATE_PATH_INVALIDATE_TIP,
  CHECK_UPDATE_PATH_COMPARE_POINT,
  CHECK_UPDATE_PATH_CONFIRM_STEP,
} from '../constants'

const log = createLogger(__filename)

const mapActionToRequest: ActionToRequestMapper<UpdateRobotCalibrationCheckSessionAction> = action => {
  switch (action.type) {
    case ROBOT_CALIBRATION_CHECK_LOAD_LABWARE: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_LOAD_LABWARE}`,
      }
    }
    case ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_PREPARE_PIPETTE}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    case ROBOT_CALIBRATION_CHECK_JOG: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_JOG}`,
        body: {
          pipetteId: action.payload.pipetteId,
          vector: action.payload.vector,
        },
      }
    }
    case ROBOT_CALIBRATION_CHECK_PICK_UP_TIP: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_PICK_UP_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    case ROBOT_CALIBRATION_CHECK_COMPARE_POINT: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_COMPARE_POINT}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    case ROBOT_CALIBRATION_CHECK_CONFIRM_TIP: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_CONFIRM_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    case ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_INVALIDATE_TIP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    case ROBOT_CALIBRATION_CHECK_CONFIRM_STEP: {
      return {
        method: POST,
        path: `${ROBOT_CALIBRATION_CHECK_PATH}/${CHECK_UPDATE_PATH_CONFIRM_STEP}`,
        body: { pipetteId: action.payload.pipetteId },
      }
    }
    default: {
      log.error(
        'Update Robot Calibration Check Session Epic failed to handle action',
        { action }
      )
      return null
    }
  }
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
      ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
      ROBOT_CALIBRATION_CHECK_CONFIRM_TIP,
      ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP,
      ROBOT_CALIBRATION_CHECK_COMPARE_POINT,
      ROBOT_CALIBRATION_CHECK_CONFIRM_STEP
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
