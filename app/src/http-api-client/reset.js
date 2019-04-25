// @flow
// API client for getting reset options and resetting robot config files
import { createSelector } from 'reselect'

import type { OutputSelector } from 'reselect'
import type { State, ThunkPromiseAction } from '../types'
import type { BaseRobot, RobotService } from '../robot'
import type { ApiCall, ApiRequestError } from './types'
import type { ApiAction } from './actions'

import { apiRequest, apiSuccess, apiFailure, clearApiResponse } from './actions'
import { getRobotApiState } from './reducer'
import client from './client'

type OptionId = string

export type ResetOption = {
  id: OptionId,
  name: string,
  description: string,
}

type FetchResetOptionsResponse = {
  options: Array<ResetOption>,
}

export type ResetRobotRequest = {
  [OptionId]: boolean,
}

type ResetRobotResponse = {}

type FetchResetOptionsCall = ApiCall<null, FetchResetOptionsResponse>
type ResetRobotCall = ApiCall<ResetRobotRequest, ResetRobotRequest>

export const OPTIONS_PATH: 'settings/reset/options' = 'settings/reset/options'
export const RESET_PATH: 'settings/reset' = 'settings/reset'

export type ResetAction =
  | ApiAction<'settings/reset/options', null, FetchResetOptionsResponse>
  | ApiAction<'settings/reset', ResetRobotRequest, ResetRobotResponse>

export type ResetState = {|
  'settings/reset/options'?: FetchResetOptionsCall,
  'settings/reset'?: ResetRobotCall,
|}

export function fetchResetOptions(robot: RobotService): ThunkPromiseAction {
  return dispatch => {
    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    dispatch(apiRequest(robot, OPTIONS_PATH, null))

    return (
      client(robot, 'GET', OPTIONS_PATH)
        .then(
          (resp: FetchResetOptionsResponse) =>
            apiSuccess(robot, OPTIONS_PATH, resp),
          (err: ApiRequestError) => apiFailure(robot, OPTIONS_PATH, err)
        )
        // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

export function resetRobotData(
  robot: RobotService,
  options: ResetRobotRequest
): ThunkPromiseAction {
  const request: ResetRobotRequest = options
  return dispatch => {
    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    dispatch(apiRequest(robot, RESET_PATH, request))

    return (
      client(robot, 'POST', RESET_PATH, request)
        .then(
          (resp: ResetRobotResponse) => apiSuccess(robot, RESET_PATH, resp),
          (err: ApiRequestError) => apiFailure(robot, RESET_PATH, err)
        )
        // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

export function makeGetRobotResetOptions() {
  const selector: OutputSelector<
    State,
    BaseRobot,
    FetchResetOptionsCall
  > = createSelector(
    getRobotApiState,
    state => state[OPTIONS_PATH] || { inProgress: false }
  )

  return selector
}

export function makeGetRobotResetRequest() {
  const selector: OutputSelector<
    State,
    BaseRobot,
    ResetRobotRequest
  > = createSelector(
    getRobotApiState,
    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    state => state[RESET_PATH] || { inProgress: false }
  )
  return selector
}

export function clearResetResponse(robot: RobotService): ResetAction {
  return clearApiResponse(robot, RESET_PATH)
}
