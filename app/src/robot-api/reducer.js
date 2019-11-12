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

import type { Action } from '../types'
import type {
  DeprecatedRobotApiState,
  RobotInstanceNetworkingState,
  RobotApiActionLike,
} from './types'

const INITIAL_INSTANCE_STATE = { networking: {}, resources: {} }

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
