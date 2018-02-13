// user interface state module

import {makeActionName} from '../util'
// TODO(mc, 2017-12-15): use module level exports; this is a temporary fix
// for a circular dependency
import {actionTypes as robotActionTypes} from '../robot/actions'

export const NAME = 'interface'
const META_ALERT = `${NAME}:alert`

export const PANEL_NAMES = ['connect', 'upload', 'setup']
export const PANEL_PROPS_BY_NAME = {
  upload: {title: 'Open Protocol'},
  setup: {title: 'Prepare for Run'},
  connect: {title: 'Robots'}
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

    case robotActionTypes.DISCONNECT_RESPONSE:
      return {...state, currentPanel: DEFAULT_PANEL}
  }

  return state
}

export function tagAlertAction (action, message) {
  const meta = action.meta || {}
  return {...action, meta: {...meta, [META_ALERT]: message}}
}

export function alertMiddleware (root) {
  return (store) => (next) => (action) => {
    const message = action.meta && action.meta[META_ALERT]

    if (message) {
      root.alert(message)
    }

    next(action)
  }
}
