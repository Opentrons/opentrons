// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import * as Constants from './constants'
import * as Types from './types'

export const restartRobot = (robotName: string): Types.RestartRobotAction => ({
  type: Constants.RESTART,
  payload: { robotName },
  meta: { robot: true },
})

export const restartRobotSuccess = (
  robotName: string,
  meta: RobotApiRequestMeta
): Types.RestartRobotSuccessAction => ({
  type: Constants.RESTART_SUCCESS,
  payload: { robotName },
  meta,
})

export const restartRobotFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.RestartRobotFailureAction => ({
  type: Constants.RESTART_FAILURE,
  payload: { robotName, error },
  meta,
})

export const fetchResetConfigOptions = (
  robotName: string
): Types.FetchResetConfigOptionsAction => ({
  type: Constants.FETCH_RESET_CONFIG_OPTIONS,
  payload: { robotName },
  meta: {},
})

export const fetchResetConfigOptionsSuccess = (
  robotName: string,
  options: Array<Types.ResetConfigOption>,
  meta: RobotApiRequestMeta
): Types.FetchResetConfigOptionsSuccessAction => ({
  type: Constants.FETCH_RESET_CONFIG_OPTIONS_SUCCESS,
  payload: { robotName, options },
  meta,
})

export const fetchResetConfigOptionsFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.FetchResetConfigOptionsFailureAction => ({
  type: Constants.FETCH_RESET_CONFIG_OPTIONS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const resetConfig = (
  robotName: string,
  resets: Types.ResetConfigRequest
): Types.ResetConfigAction => ({
  type: Constants.RESET_CONFIG,
  payload: { robotName, resets },
  meta: {},
})

export const resetConfigSuccess = (
  robotName: string,
  meta: RobotApiRequestMeta
): Types.ResetConfigSuccessAction => ({
  type: Constants.RESET_CONFIG_SUCCESS,
  payload: { robotName },
  meta,
})

export const resetConfigFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.ResetConfigFailureAction => ({
  type: Constants.RESET_CONFIG_FAILURE,
  payload: { robotName, error },
  meta,
})
