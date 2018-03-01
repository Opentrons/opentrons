// user interface state module

import {makeActionName} from '../util'

export const NAME = 'interface'

export const PANEL_NAMES = ['connect', 'upload', 'setup', 'more']
export const PANEL_PROPS_BY_NAME = {
  upload: {title: 'Open Protocol'},
  setup: {title: 'Prepare for Run'},
  connect: {title: 'Robots'},
  more: {title: 'Menu'}
}
const DEFAULT_PANEL = 'connect'

export const PANELS = PANEL_NAMES.map((name) => ({
  name,
  ...PANEL_PROPS_BY_NAME[name]
}))

const makeInterfaceActionName = (action) => makeActionName(NAME, action)
const getModuleState = (state) => state[NAME]

const INITIAL_STATE = {
  isPanelClosed: false,
  currentPanel: DEFAULT_PANEL
}

export const selectors = {
  getIsPanelClosed (state) {
    return getModuleState(state).isPanelClosed
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
      return {...state, isPanelClosed: true}

    case actionTypes.SET_CURRENT_PANEL:
      return {...state, isPanelClosed: false, currentPanel: payload.panel}

    case 'robot:DISCONNECT_RESPONSE':
      return {...state, currentPanel: DEFAULT_PANEL}
  }

  return state
}
