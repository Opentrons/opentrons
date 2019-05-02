// @flow
// api state reducer
// tracks resource and networking state per robot
import {
  passApiAction,
  passRequestAction,
  passResponseAction,
  passErrorAction,
} from './utils'
import { resourcesReducer } from './resources'

import type { Action } from '../types'
import type { ApiActionLike, ApiState, NetworkingInstanceState } from './types'

const INITIAL_INSTANCE_STATE = { networking: {}, resources: {} }

function networkingReducer(
  state: NetworkingInstanceState = INITIAL_INSTANCE_STATE.networking,
  action: ApiActionLike
): NetworkingInstanceState {
  const request = passRequestAction(action)
  const response = passResponseAction(action) || passErrorAction(action)
  let nextState = state

  if (request) {
    nextState = { ...state, [request.payload.path]: { inProgress: true } }
  } else if (response) {
    nextState = { ...state, [response.payload.path]: { inProgress: false } }
  }

  return nextState
}

function robotApiReducer(state: ApiState = {}, action: Action): ApiState {
  const apiAction = passApiAction(action)

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
