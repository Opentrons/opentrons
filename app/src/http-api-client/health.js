// @flow
// health http api module
import {createSelector, type Selector} from 'reselect'

import type {State, ThunkPromiseAction, Action} from '../types'
import type {BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import type {ApiRequestAction, ApiSuccessAction, ApiFailureAction} from './actions'

import {apiRequest, apiSuccess, apiFailure} from './actions'
import client from './client'

type HealthPath = 'health'

type HealthResponse = {
  name: string,
  api_version: string,
  fw_version: string,
}

export type HealthAction =
  | ApiRequestAction<HealthPath, void>
  | ApiSuccessAction<HealthPath, HealthResponse>
  | ApiFailureAction<HealthPath>

export type RobotHealth = ApiCall<void, HealthResponse>

type RobotHealthState = {
  health?: RobotHealth,
}

type HealthState = {
  [robotName: string]: ?RobotHealthState
}

const HEALTH: 'health' = 'health'

// TODO(mc, 2018-07-03): flow helper until we have one reducer, since
// p === 'constant' checks but p === CONSTANT does not, even if
// CONSTANT is defined as `const CONSTANT: 'constant' = 'constant'`
function getHealthPath (p: string): ?HealthPath {
  if (p === 'health') return p
  return null
}

export function fetchHealth (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(apiRequest(robot, HEALTH, null))

    return client(robot, 'GET', HEALTH)
      .then(
        (resp: HealthResponse) => apiSuccess(robot, HEALTH, resp),
        (err: ApiRequestError) => apiFailure(robot, HEALTH, err)
      )
      .then(dispatch)
  }
}

export function healthReducer (
  state: ?HealthState,
  action: Action
): HealthState {
  if (state == null) return {}

  switch (action.type) {
    case 'api:REQUEST': {
      const path = getHealthPath(action.payload.path)
      if (!path) return state
      const {payload: {request, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, request, inProgress: true, error: null}
        }
      }
    }

    case 'api:SUCCESS': {
      const path = getHealthPath(action.payload.path)
      if (!path) return state
      const {payload: {response, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response, inProgress: false, error: null}
        }
      }
    }

    case 'api:FAILURE': {
      const path = getHealthPath(action.payload.path)
      if (!path) return state
      const {payload: {error, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, error, inProgress: false}
        }
      }
    }
  }

  return state
}

export const makeGetRobotHealth = () => {
  const selector: Selector<State, BaseRobot, RobotHealth> = createSelector(
    selectRobotHealthState,
    state => state[HEALTH] || {inProgress: false}
  )

  return selector
}

function selectRobotHealthState (
  state: State,
  props: BaseRobot
): RobotHealthState {
  return state.api.health[props.name] || {}
}
