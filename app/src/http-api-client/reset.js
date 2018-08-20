// @flow
// API client for getting reset options and resetting robot config files
import {createSelector, type Selector} from 'reselect'

import type {State, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import type {ApiAction} from './actions'

import {apiRequest, apiSuccess, apiFailure} from './actions'
import {getRobotApiState} from './reducer'
import client from './client'

type Id = string

export type Option = {
  id: Id,
  title: string,
  description: string,
}

type FetchResetOptionsResponse = {
  options: Array<Option>,
}

type FetchResetOptionsCall = ApiCall<null, FetchResetOptionsResponse>

export type OptionsState = {
  [robotName: string]: ?FetchResetOptionsCall,
}

export type ResetAction =
  | ApiAction<'OPTIONS_PATH', null, FetchResetOptionsResponse>

const OPTIONS_PATH: 'settings/reset/options' = 'settings/reset/options'
// const RESET_PATH: 'settings/reset' = 'settings/reset'

export function fetchResetOptions (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(apiRequest(robot, OPTIONS_PATH, null))

    return client(robot, 'GET', OPTIONS_PATH)
      .then(
        (resp: FetchResetOptionsResponse) => apiSuccess(robot, OPTIONS_PATH, resp),
        (err: ApiRequestError) => apiFailure(robot, OPTIONS_PATH, err)
      )
      .then(dispatch)
  }
}

export function makeGetRobotResetOptions () {
  const selector: Selector<State, BaseRobot, FetchResetOptionsCall> = createSelector(
    getRobotApiState,
    (state) => state[OPTIONS_PATH] || {inProgress: false}
  )

  return selector
}
