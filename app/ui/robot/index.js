// robot UI entry point
// split up into reducer.js, action.js, etc if / when necessary
import api from './api-middleware'

export const NAME = 'robot'

// reducer / action helpers
const makeActionName = (action) => `${NAME}:${action}`
const makeRequestInitialState = (value, inProgress = false) => ({
  value,
  requestInProgress: inProgress,
  error: null
})

const INITIAL_STATE = {
  // TODO(mc): maybe don't connect automatically?
  isConnected: makeRequestInitialState(false, true),
  // TODO(mc): keep track of axes and get homed state from robot
  isHomed: makeRequestInitialState(false),
  // TODO(mc): this won't work but whatever
  isRunning: makeRequestInitialState(false)
}

export const apiMiddleware = api

export const actionTypes = {
  CONNECT_RESPONSE: makeActionName('CONNECT_RESPONSE'),
  HOME: makeActionName('HOME'),
  HOME_RESPONSE: makeActionName('HOME_RESPONSE'),
  RUN: makeActionName('RUN'),
  RUN_RESPONSE: makeActionName('RUN_RESPONSE')
}

export const actions = {
  connectResponse (error = null) {
    return {
      type: actionTypes.CONNECT_RESPONSE,
      error
    }
  },

  home (axes) {
    return {
      type: actionTypes.HOME,
      meta: {robotCommand: true},
      payload: {axes}
    }
  },

  homeResponse (error = null) {
    return {
      type: actionTypes.HOME_RESPONSE,
      error
    }
  },

  run () {
    return {
      type: actionTypes.RUN,
      meta: {robotCommand: true}
    }
  },

  runResponse (error = null) {
    return {
      type: actionTypes.RUN_RESPONSE,
      error
    }
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, error} = action

  switch (type) {
    case actionTypes.CONNECT_RESPONSE:
      return {
        ...state,
        isConnected: {
          ...state.isConnected,
          value: !error,
          requestInProgress: false,
          error
        }
      }

    case actionTypes.HOME:
      return {
        ...state,
        isHomed: {...state.isHomed, requestInProgress: true, error: null}
      }

    case actionTypes.HOME_RESPONSE:
      return {
        ...state,
        isHomed: {
          ...state.isHomed,
          value: !error,
          requestInProgress: false,
          error
        }
      }

    case actionTypes.RUN:
      return {
        ...state,
        isRunning: {...state.isRunning, requestInProgress: true, error: null}
      }

    case actionTypes.RUN_RESPONSE:
      return {
        ...state,
        isRunning: {
          ...state.isRunning,
          value: !error,
          requestInProgress: false,
          error
        }
      }
  }

  return state
}
