// robot UI entry point
// split up into reducer.js, action.js, etc if / when necessary

export const NAME = 'robot'

// reducer / action helpers
const makeRequestInitialState = () => ({requestInProgress: false, error: null})
const makeActionName = (action) => `${NAME}:${action}`

const INITIAL_STATE = {
  home: makeRequestInitialState(),
  run: makeRequestInitialState()
}

export const actionTypes = {
  HOME: makeActionName('HOME'),
  HOME_RESPONSE: makeActionName('HOME_RESPONSE'),
  RUN: makeActionName('RUN'),
  RUN_RESPONSE: makeActionName('RUN_RESPONSE')
}

export const actions = {
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
    case actionTypes.HOME:
      return {
        ...state,
        home: {...state.home, requestInProgress: true}
      }

    case actionTypes.HOME_RESPONSE:
      return {
        ...state,
        home: {
          ...state.home,
          requestInProgress: false,
          error
        }
      }

    case actionTypes.RUN:
      return {
        ...state,
        run: {...state.run, requestInProgress: true}
      }

    case actionTypes.RUN_RESPONSE:
      return {
        ...state,
        run: {
          ...state.run,
          requestInProgress: false,
          error
        }
      }
  }

  return state
}
