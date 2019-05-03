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
  RobotApiState,
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

  let nextState = state

  if (reqAction) {
    nextState = { ...state, [reqAction.payload.path]: { inProgress: true } }
  } else if (resAction) {
    nextState = { ...state, [resAction.payload.path]: { inProgress: false } }
  }

  return nextState
}

function robotApiReducer(
  state: RobotApiState = {},
  action: Action
): RobotApiState {
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

export { robotApiReducer }
