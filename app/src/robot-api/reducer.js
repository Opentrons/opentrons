// @flow
// api state reducer
// tracks resource and networking state per robot
import { API_CALL, API_RESPONSE, API_ERROR } from './utils'
import { resourcesReducer } from './resources'

import type { Action } from '../types'
import type { NetworkingInstanceState, ApiState, ApiAction } from './types'

const INITIAL_INSTANCE_STATE = { networking: {}, resources: {} }

function networkingReducer(
  state: NetworkingInstanceState = INITIAL_INSTANCE_STATE.networking,
  action: ApiAction
): NetworkingInstanceState {
  switch (action.type) {
    case API_CALL: {
      return { ...state, [action.payload.path]: { inProgress: true } }
    }

    case API_RESPONSE:
    case API_ERROR: {
      return { ...state, [action.payload.path]: { inProgress: false } }
    }
  }

  return state
}

function robotApiReducer(state: ApiState = {}, action: Action): ApiState {
  switch (action.type) {
    case API_CALL:
    case API_RESPONSE:
    case API_ERROR: {
      const { name } = action.payload.host
      const stateByName = state[name] || INITIAL_INSTANCE_STATE

      return {
        ...state,
        [name]: {
          networking: networkingReducer(stateByName.networking, action),
          resources: resourcesReducer(stateByName.resources, action),
        },
      }
    }
  }

  return state
}

export { robotApiReducer }
