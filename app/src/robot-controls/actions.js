// @flow

import * as Constants from './constants'
import * as Types from './types'

import type { RobotApiRequestMeta } from '../robot-api/types'

export const fetchLights = (robotName: string): Types.FetchLightsAction => ({
  type: Constants.FETCH_LIGHTS,
  payload: { robotName },
  meta: {},
})

export const fetchLightsSuccess = (
  robotName: string,
  lightsOn: boolean,
  meta: RobotApiRequestMeta
): Types.FetchLightsSuccessAction => ({
  type: Constants.FETCH_LIGHTS_SUCCESS,
  payload: { robotName, lightsOn },
  meta,
})

export const fetchLightsFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.FetchLightsFailureAction => ({
  type: Constants.FETCH_LIGHTS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const updateLights = (
  robotName: string,
  lightsOn: boolean
): Types.UpdateLightsAction => ({
  type: Constants.UPDATE_LIGHTS,
  payload: { robotName, lightsOn },
  meta: {},
})

export const updateLightsSuccess = (
  robotName: string,
  lightsOn: boolean,
  meta: RobotApiRequestMeta
): Types.UpdateLightsSuccessAction => ({
  type: Constants.UPDATE_LIGHTS_SUCCESS,
  payload: { robotName, lightsOn },
  meta,
})

export const updateLightsFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.UpdateLightsFailureAction => ({
  type: Constants.UPDATE_LIGHTS_FAILURE,
  payload: { robotName, error },
  meta,
})
