// @flow
// api state reducer
// tracks resource and networking state per robot
import {
  passRobotApiAction,
  passRobotApiRequestAction,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from './utils'
import { resourcesReducer } from './resources'
import { PENDING, SUCCESS, FAILURE } from './constants'

import type { Action } from '../types'
import type {
  RobotApiState,
  DeprecatedRobotApiState,
  RobotInstanceNetworkingState,
  RobotApiActionLike,
} from './types'

const INITIAL_INSTANCE_STATE = { networking: {}, resources: {} }

// TODO(mc, 2019-11-12): deprecated, remove when able
function networkingReducer(
  state: RobotInstanceNetworkingState = INITIAL_INSTANCE_STATE.networking,
  action: RobotApiActionLike
): RobotInstanceNetworkingState {
  const reqAction = passRobotApiRequestAction(action)
  const resAction =
    passRobotApiResponseAction(action) || passRobotApiErrorAction(action)

  if (reqAction) {
    return { ...state, [reqAction.payload.path]: { response: null } }
  }

  if (resAction) {
    return {
      ...state,
      [resAction.payload.path]: { response: resAction.payload },
    }
  }

  return state
}

// TODO(mc, 2019-11-12): deprecated, remove when able
export function deprecatedRobotApiReducer(
  state: DeprecatedRobotApiState = {},
  action: Action
): DeprecatedRobotApiState {
  const apiAction = passRobotApiAction(action)

  if (apiAction) {
    const { name } = apiAction.payload.host
    const stateByName = state[name] || INITIAL_INSTANCE_STATE

    return {
      ...state,
      [name]: {
        networking: networkingReducer(stateByName.networking, apiAction),
        resources: resourcesReducer(stateByName.resources, apiAction),
      },
    }
  }

  return state
}

export function robotApiReducer(
  state: RobotApiState = {},
  action: Action
): RobotApiState {
  const meta = action.meta ? action.meta : {}

  if (meta.requestId != null) {
    if (!meta.response) {
      return { ...state, [meta.requestId]: { status: PENDING } }
    }

    if (meta.response.ok) {
      return {
        ...state,
        [meta.requestId]: { status: SUCCESS, response: meta.response },
      }
    }

    if (meta.response.ok === false) {
      const error =
        action.payload && action.payload.error ? action.payload.error : {}

      return {
        ...state,
        [meta.requestId]: {
          status: FAILURE,
          response: meta.response,
          error,
        },
      }
    }
  }

  return state
}
