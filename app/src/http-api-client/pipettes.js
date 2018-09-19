// @flow
// pipette state from api
import {createSelector, type Selector} from 'reselect'

import type {State, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService} from '../robot'

import {apiRequest, apiSuccess, apiFailure} from './actions'
import type {ApiCall} from './types'
import type {ApiAction} from './actions'
import {getRobotApiState} from './reducer'

import type {MotorAxis} from './motors'
import client, {type ApiRequestError} from './client'

// TODO(mc, 2018-03-30): mount, volume, and channels should come from the API
export type Pipette = {
  model: ?string,
  mount_axis: MotorAxis,
  plunger_axis: MotorAxis,
}

export type PipettesResponse = {
  right: Pipette,
  left: Pipette,
}

type FetchPipettesCall = ApiCall<null, PipettesResponse>

export type PipettesAction = ApiAction<'pipette', null, PipettesResponse>

export type RobotPipettes = ApiCall<void, PipettesResponse>

export type PipettesState = {
  pipettes?: FetchPipettesCall,
}

const PIPETTES: 'pipettes' = 'pipettes'

export function fetchPipettes (
  robot: RobotService,
  refresh: boolean = false
): ThunkPromiseAction {
  let path = PIPETTES
  if (refresh) path += '?refresh=true'

  return (dispatch) => {
    dispatch(apiRequest(robot, path, null))

    return client(robot, 'GET', path)
      .then(
        (resp: PipettesResponse) => apiSuccess(robot, PIPETTES, resp),
        (err: ApiRequestError) => apiFailure(robot, PIPETTES, err)
      )
      .then(dispatch)
  }
}

export const makeGetRobotPipettes = () => {
  const selector: Selector<State, BaseRobot, RobotPipettes> = createSelector(
    getRobotApiState,
    (state) => state[PIPETTES] || {inProgress: false}
  )

  return selector
}
