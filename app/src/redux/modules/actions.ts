import * as Constants from './constants'
import * as Types from './types'

import type { RobotApiRequestMeta } from '../robot-api/types'

// update module

export const updateModule = (
  robotName: string,
  moduleId: string
): Types.UpdateModuleAction => ({
  type: Constants.UPDATE_MODULE,
  payload: { robotName, moduleId },
  meta: {},
})

export const updateModuleSuccess = (
  robotName: string,
  moduleId: string,
  message: string,
  meta: RobotApiRequestMeta
): Types.UpdateModuleSuccessAction => ({
  type: Constants.UPDATE_MODULE_SUCCESS,
  payload: { robotName, moduleId, message },
  meta,
})

export const updateModuleFailure = (
  robotName: string,
  moduleId: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.UpdateModuleFailureAction => ({
  type: Constants.UPDATE_MODULE_FAILURE,
  payload: { robotName, moduleId, error },
  meta,
})
