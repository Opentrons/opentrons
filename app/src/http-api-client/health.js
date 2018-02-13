// @flow
// http api actions and action types
import type {State, ThunkAction, Action} from '../types'
import type {RobotService} from '../robot'

import client, {type ClientResponseError} from './client'

export type HealthResponse = {
  api_version: string,
  fw_version: string,
}

export type HealthRequestAction = {|
  type: 'api:HEALTH_REQUEST',
  payload: {
    robot: RobotService
  }
|}

export type HealthSuccessAction = {|
  type: 'api:HEALTH_SUCCESS',
  payload: {|
    robot: RobotService,
    health: HealthResponse
  |}
|}

export type HealthFailureAction = {|
  type: 'api:HEALTH_FAILURE',
  payload: {|
    robot: RobotService,
    error: ClientResponseError
  |}
|}

export type HealthAction =
 | HealthRequestAction
 | HealthSuccessAction
 | HealthFailureAction

export type HealthState = {
  /** robot name */
  [string]: {
    /** request in progress flag */
    inProgress: boolean,
    /** possible error response */
    error: ?ClientResponseError,
    /** possible success response */
    response: ?HealthResponse
  }
}

export function fetchHealth (robot: RobotService): ThunkAction {
  return (dispatch) => {
    dispatch(healthRequest(robot))

    return client(robot, 'GET', 'health')
      .then((maybeHealth) => dispatch(healthResponse(null, robot, maybeHealth)))
      .catch((error) => dispatch(healthResponse(error, robot)))
  }
}

function healthRequest (robot: RobotService): HealthRequestAction {
  return {type: 'api:HEALTH_REQUEST', payload: {robot}}
}

function healthResponse (
  error: ?Error,
  robot: RobotService,
  maybeHealth?: any
): HealthSuccessAction | HealthFailureAction {
  if (error || typeof maybeHealth !== 'object') {
    return {
      type: 'api:HEALTH_FAILURE',
      payload: {
        robot,
        error: error || {name: 'Error', message: 'malformed /health response'}
      }
    }
  }

  return {
    type: 'api:HEALTH_SUCCESS',
    payload: {
      robot,
      health: {
        api_version: maybeHealth.api_version,
        fw_version: maybeHealth.fw_version
      }
    }
  }
}

export function healthReducer (
  state: ?HealthState,
  action: Action
): HealthState {
  if (state == null) return {}

  switch (action.type) {
    case 'api:HEALTH_REQUEST':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: true,
          error: null
        }
      }

    case 'api:HEALTH_SUCCESS':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: false,
          response: action.payload.health
        }
      }

    case 'api:HEALTH_FAILURE':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: false,
          error: action.payload.error
        }
      }
  }

  return state
}

export function selectHealth (state: State) {
  return state.api.health
}
