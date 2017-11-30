// user interface state module

import {makeActionName} from '../util'

export const NAME = 'interface'

const makeInterfaceActionName = (action) => makeActionName(NAME, action)
const getModuleState = (state) => state[NAME]

const INITIAL_STATE = {
  isPanelOpen: false,
  currentPanel: 'connect'
}

export const selectors = {
  getIsPanelOpen (state) {
    return getModuleState(state).isPanelOpen
  },

  getCurrentPanel (state) {
    return getModuleState(state).currentPanel
  }
}

export const actionTypes = {
  CLOSE_PANEL: makeInterfaceActionName('CLOSE_PANEL'),
  SET_CURRENT_PANEL: makeInterfaceActionName('SET_CURRENT_PANEL')
}

export const actions = {
  closePanel () {
    return {type: actionTypes.CLOSE_PANEL}
  },

  setCurrentPanel (panel = '') {
    return {type: actionTypes.SET_CURRENT_PANEL, payload: {panel}}
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, payload} = action

  switch (type) {
    case actionTypes.CLOSE_PANEL:
      return {...state, isPanelOpen: false}

    case actionTypes.SET_CURRENT_PANEL:
      return {...state, isPanelOpen: true, currentPanel: payload.panel}
  }

  return state
}
