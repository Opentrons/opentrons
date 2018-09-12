// @flow
// pipette state from api
import {createSelector, type Selector} from 'reselect'

import type {State, Action, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService} from '../robot'

import type {ApiCall} from './types'
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

export type PipettesRequestAction = {|
  type: 'api:PIPETTES_REQUEST',
  payload: {|
    robot: RobotService,
  |},
|}

export type PipettesSuccessAction = {|
  type: 'api:PIPETTES_SUCCESS',
  payload: {|
    robot: RobotService,
    pipettes: PipettesResponse,
  |},
|}

export type PipettesFailureAction = {|
  type: 'api:PIPETTES_FAILURE',
  payload: {|
    robot: RobotService,
    error: ApiRequestError,
  |},
|}

export type PipettesAction =
  | PipettesRequestAction
  | PipettesSuccessAction
  | PipettesFailureAction

export type RobotPipettes = ApiCall<void, PipettesResponse>

type PipettesState = {
  [robotName: string]: ?RobotPipettes,
}

export function fetchPipettes (
  robot: RobotService,
  refresh: boolean = false
): ThunkPromiseAction {
  let path = 'pipettes'
  if (refresh) path += '?refresh=true'

  return (dispatch) => {
    dispatch({type: 'api:PIPETTES_REQUEST', payload: {robot}})

    return client(robot, 'GET', path)
      .then((pipettes) => (
        {type: 'api:PIPETTES_SUCCESS', payload: {robot, pipettes}}
      )).catch((error) => (
        {type: 'api:PIPETTES_FAILURE', payload: {robot, error}}
      )).then((action) => dispatch(action))
  }
}

export function pipettesReducer (
  state: ?PipettesState,
  action: Action
): PipettesState {
  if (state == null) return {}

  let name
  let pipettes
  let error

  switch (action.type) {
    case 'api:PIPETTES_REQUEST':
      ({robot: {name}} = action.payload)
      return {
        ...state,
        [name]: {...state[name], error: null, inProgress: true},
      }

    case 'api:PIPETTES_SUCCESS':
      ({pipettes, robot: {name}} = action.payload)
      return {
        ...state,
        [name]: {error: null, response: pipettes, inProgress: false},
      }

    case 'api:PIPETTES_FAILURE':
      ({error, robot: {name}} = action.payload)
      return {
        ...state,
        [name]: {...state[name], error, inProgress: false},
      }
  }

  return state
}

export const makeGetRobotPipettes = () => {
  const selector: Selector<State, BaseRobot, RobotPipettes> = createSelector(
    selectRobotPipettesState,
    (state) => state || {inProgress: false, error: null, response: null}
  )

  return selector
}

function selectRobotPipettesState (state: State, props: BaseRobot) {
  return state.api.pipettes[props.name]
}
