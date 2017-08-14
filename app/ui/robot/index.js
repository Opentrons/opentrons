// robot UI entry point
// split up into reducer.js, action.js, etc if / when necessary
import api from './api-client'

export const NAME = 'robot'

// reducer / action helpers
const makeActionName = (action) => `${NAME}:${action}`
const makeRequestInitialState = () => ({inProgress: false, error: null})

const INITIAL_STATE = {
  // request states
  connectRequest: makeRequestInitialState(),
  homeRequest: makeRequestInitialState(),
  runRequest: makeRequestInitialState(),

  // instantaneous robot state
  isConnected: false
}

export const apiClientMiddleware = api

export const actionTypes = {
  // requests and responses
  CONNECT: makeActionName('CONNECT'),
  CONNECT_RESPONSE: makeActionName('CONNECT_RESPONSE'),
  HOME: makeActionName('HOME'),
  HOME_RESPONSE: makeActionName('HOME_RESPONSE'),
  RUN: makeActionName('RUN'),
  RUN_RESPONSE: makeActionName('RUN_RESPONSE'),

  // instantaneous state
  SET_IS_CONNECTED: makeActionName('SET_IS_CONNECTED')
}

export const actions = {
  // TODO(mc): connect should take a URL or robot identifier
  connect () {
    return {
      type: actionTypes.CONNECT,
      meta: {robotCommand: true}
    }
  },

  connectResponse (error = null) {
    return {
      type: actionTypes.CONNECT_RESPONSE,
      error
    }
  },

  home (axes) {
    const action = {
      type: actionTypes.HOME,
      meta: {robotCommand: true}
    }

    if (axes != null) action.payload = {axes}

    return action
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
  },

  setIsConnected (isConnected) {
    return {
      type: actionTypes.SET_IS_CONNECTED,
      payload: {isConnected}
    }
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, payload, error} = action

  switch (type) {
    case actionTypes.CONNECT:
      return {
        ...state,
        connectRequest: {...state.connectRequest, inProgress: true, error: null}
      }

    case actionTypes.CONNECT_RESPONSE:
      return {
        ...state,
        connectRequest: {...state.connectRequest, inProgress: false, error}
      }

    case actionTypes.HOME:
      return {
        ...state,
        homeRequest: {...state.homeRequest, inProgress: true, error: null}
      }

    case actionTypes.HOME_RESPONSE:
      return {
        ...state,
        homeRequest: {...state.homeRequest, inProgress: false, error}
      }

    case actionTypes.RUN:
      return {
        ...state,
        runRequest: {...state.runRequest, inProgress: true, error: null}
      }

    case actionTypes.RUN_RESPONSE:
      return {
        ...state,
        runRequest: {...state.runRequest, inProgress: false, error}
      }

    case actionTypes.SET_IS_CONNECTED:
      return {...state, ...payload}
  }

  return state
}
