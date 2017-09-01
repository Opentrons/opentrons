// user interface state module

import {makeActionName} from '../util'

export const NAME = 'interface'

const makeInterfaceActionName = (action) => makeActionName(NAME, action)
const getModuleState = (state) => state[NAME]

const INITIAL_STATE = {
  isNavPanelOpen: false,
  currentNavPanelTask: 'upload'
}

export const selectors = {
  getIsNavPanelOpen (allState) {
    return getModuleState(allState).isNavPanelOpen
  },
  getCurrentNavPanelTask (allState) {
    return getModuleState(allState).currentNavPanelTask
  }
}

export const actionTypes = {
  TOGGLE_NAV_PANEL: makeInterfaceActionName('TOGGLE_NAV_PANEL')
}

export const actions = {
  toggleNavPanel () {
    return {
      type: actionTypes.TOGGLE_NAV_PANEL
    }
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type} = action

  switch (type) {
    case actionTypes.TOGGLE_NAV_PANEL:
      return {...state, isNavPanelOpen: !state.isNavPanelOpen}
  }

  return state
}
